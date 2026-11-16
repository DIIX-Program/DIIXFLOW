import {
  CreateStateMachineCommand,
  UpdateStateMachineCommand,
  PublishStateMachineVersionCommand,
  StartExecutionCommand,
  DescribeExecutionCommand,
  StopExecutionCommand,
  GetExecutionHistoryCommand,
  DescribeStateMachineCommand,
  HistoryEvent,
} from '@aws-sdk/client-sfn';
import { getStepFunctionsClient } from '../clients/step-functions.client.js';
import { getEnvironmentConfig } from '../config/environment.js';

export interface PublishWorkflowInput {
  workflowId: string;
  name: string;
  version: number;
  aslDefinition: Record<string, unknown>;
  roleArn?: string;
}

export interface PublishedWorkflow {
  workflowId: string;
  version: number;
  stateMachineArn: string;
  versionArn: string;
}

export interface StartExecutionInput {
  stateMachineArn: string;
  executionName?: string;
  inputPayload: Record<string, unknown>;
}

export interface StartedExecution {
  executionArn: string;
  startDate: Date;
}

export interface NormalizedExecutionHistoryEvent {
  id: string;
  timestamp: string;
  type: string;
  stateName?: string;
  stateType?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  cause?: string;
}

export interface ExecutionResult {
  executionArn: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED';
  startDate: Date;
  stopDate?: Date;
  input?: unknown;
  output?: unknown;
  error?: string;
  cause?: string;
}

export interface WorkflowExecutionProvider {
  publishWorkflow(input: PublishWorkflowInput): Promise<PublishedWorkflow>;
  startExecution(input: StartExecutionInput): Promise<StartedExecution>;
  describeExecution(executionArn: string): Promise<ExecutionResult>;
  stopExecution(executionArn: string, cause?: string): Promise<void>;
  getExecutionHistory(executionArn: string): Promise<NormalizedExecutionHistoryEvent[]>;
}

export class StepFunctionsExecutionProvider implements WorkflowExecutionProvider {
  private client = getStepFunctionsClient();
  private env = getEnvironmentConfig();

  async publishWorkflow(input: PublishWorkflowInput): Promise<PublishedWorkflow> {
    const roleArn = input.roleArn || this.env.stateMachineRoleArn;
    const stateMachineName = `FlowOps_${input.workflowId.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const definitionString = JSON.stringify(input.aslDefinition);

    let stateMachineArn = '';

    // Check if State Machine already exists
    try {
      // In LocalStack / AWS, construct the predictable ARN or describe
      const testArn = `arn:aws:states:${this.env.region}:${this.env.isLocal ? '000000000000' : '123456789012'}:stateMachine:${stateMachineName}`;
      await this.client.send(new DescribeStateMachineCommand({ stateMachineArn: testArn }));
      
      // Update definition if exists
      const updateRes = await this.client.send(
        new UpdateStateMachineCommand({
          stateMachineArn: testArn,
          definition: definitionString,
          roleArn,
        })
      );
      stateMachineArn = testArn;
    } catch {
      // Create new State Machine
      const createRes = await this.client.send(
        new CreateStateMachineCommand({
          name: stateMachineName,
          definition: definitionString,
          roleArn,
          type: 'STANDARD',
        })
      );
      stateMachineArn = createRes.stateMachineArn!;
    }

    // Publish Immutable Version if supported by LocalStack/AWS
    let versionArn = `${stateMachineArn}:${input.version}`;
    try {
      const versionRes = await this.client.send(
        new PublishStateMachineVersionCommand({
          stateMachineArn,
          description: `Version ${input.version} published via FlowOps Studio`,
        })
      );
      if (versionRes.stateMachineVersionArn) {
        versionArn = versionRes.stateMachineVersionArn;
      }
    } catch {
      // Fallback to predictable version ARN when LocalStack community doesn't enable PublishStateMachineVersion
      versionArn = `${stateMachineArn}:${input.version}`;
    }

    return {
      workflowId: input.workflowId,
      version: input.version,
      stateMachineArn,
      versionArn,
    };
  }

  async startExecution(input: StartExecutionInput): Promise<StartedExecution> {
    const name = input.executionName || `exec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const res = await this.client.send(
      new StartExecutionCommand({
        stateMachineArn: input.stateMachineArn,
        name,
        input: JSON.stringify(input.inputPayload),
      })
    );

    return {
      executionArn: res.executionArn!,
      startDate: res.startDate || new Date(),
    };
  }

  async describeExecution(executionArn: string): Promise<ExecutionResult> {
    const res = await this.client.send(
      new DescribeExecutionCommand({ executionArn })
    );

    let parsedInput: unknown = null;
    let parsedOutput: unknown = null;
    try {
      if (res.input) parsedInput = JSON.parse(res.input);
    } catch {}
    try {
      if (res.output) parsedOutput = JSON.parse(res.output);
    } catch {}

    let normalizedStatus: ExecutionResult['status'] = 'RUNNING';
    if (res.status === 'SUCCEEDED') normalizedStatus = 'SUCCEEDED';
    else if (res.status === 'FAILED') normalizedStatus = 'FAILED';
    else if (res.status === 'TIMED_OUT') normalizedStatus = 'TIMED_OUT';
    else if (res.status === 'ABORTED') normalizedStatus = 'ABORTED';

    return {
      executionArn,
      status: normalizedStatus,
      startDate: res.startDate || new Date(),
      stopDate: res.stopDate,
      input: parsedInput,
      output: parsedOutput,
      error: res.error,
      cause: res.cause,
    };
  }

  async stopExecution(executionArn: string, cause?: string): Promise<void> {
    await this.client.send(
      new StopExecutionCommand({
        executionArn,
        cause: cause || 'Halted by operator',
        error: 'USER_ABORT',
      })
    );
  }

  async getExecutionHistory(executionArn: string): Promise<NormalizedExecutionHistoryEvent[]> {
    const res = await this.client.send(
      new GetExecutionHistoryCommand({
        executionArn,
        maxResults: 100,
        reverseOrder: false,
      })
    );

    const events: NormalizedExecutionHistoryEvent[] = [];
    for (const evt of res.events || []) {
      const normalized = this.normalizeHistoryEvent(evt);
      if (normalized) events.push(normalized);
    }

    return events;
  }

  private normalizeHistoryEvent(evt: HistoryEvent): NormalizedExecutionHistoryEvent | null {
    if (!evt.type) return null;

    let stateName: string | undefined;
    let stateType: string | undefined;
    let input: unknown;
    let output: unknown;
    let error: string | undefined;
    let cause: string | undefined;

    if (evt.stateEnteredEventDetails) {
      stateName = evt.stateEnteredEventDetails.name;
      try {
        if (evt.stateEnteredEventDetails.input) input = JSON.parse(evt.stateEnteredEventDetails.input);
      } catch {}
    } else if (evt.stateExitedEventDetails) {
      stateName = evt.stateExitedEventDetails.name;
      try {
        if (evt.stateExitedEventDetails.output) output = JSON.parse(evt.stateExitedEventDetails.output);
      } catch {}
    } else if (evt.lambdaFunctionScheduledEventDetails) {
      stateName = 'LambdaInvokeScheduled';
    } else if (evt.lambdaFunctionSucceededEventDetails) {
      try {
        if (evt.lambdaFunctionSucceededEventDetails.output) {
          output = JSON.parse(evt.lambdaFunctionSucceededEventDetails.output);
        }
      } catch {}
    } else if (evt.lambdaFunctionFailedEventDetails) {
      error = evt.lambdaFunctionFailedEventDetails.error;
      cause = evt.lambdaFunctionFailedEventDetails.cause;
    } else if (evt.executionFailedEventDetails) {
      error = evt.executionFailedEventDetails.error;
      cause = evt.executionFailedEventDetails.cause;
    }

    return {
      id: String(evt.id || ''),
      timestamp: evt.timestamp ? evt.timestamp.toISOString() : new Date().toISOString(),
      type: evt.type,
      stateName,
      stateType,
      input,
      output,
      error,
      cause,
    };
  }
}
