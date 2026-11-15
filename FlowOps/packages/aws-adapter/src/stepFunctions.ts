import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  StopExecutionCommand,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from '@aws-sdk/client-sfn';

export class StepFunctionsService {
  private client: SFNClient;

  constructor(region: string = process.env.AWS_REGION || 'ap-southeast-1') {
    this.client = new SFNClient({ region });
  }

  async startExecution(stateMachineArn: string, name: string, inputPayload: Record<string, unknown>) {
    const command = new StartExecutionCommand({
      stateMachineArn,
      name,
      input: JSON.stringify(inputPayload),
    });
    return await this.client.send(command);
  }

  async describeExecution(executionArn: string) {
    const command = new DescribeExecutionCommand({ executionArn });
    return await this.client.send(command);
  }

  async stopExecution(executionArn: string, cause?: string) {
    const command = new StopExecutionCommand({
      executionArn,
      cause: cause || 'Stopped by user in FlowOps Console',
      error: 'USER_ABORT',
    });
    return await this.client.send(command);
  }

  async sendTaskSuccess(taskToken: string, outputPayload: Record<string, unknown>) {
    const command = new SendTaskSuccessCommand({
      taskToken,
      output: JSON.stringify(outputPayload),
    });
    return await this.client.send(command);
  }

  async sendTaskFailure(taskToken: string, error: string, cause: string) {
    const command = new SendTaskFailureCommand({
      taskToken,
      error,
      cause,
    });
    return await this.client.send(command);
  }
}
