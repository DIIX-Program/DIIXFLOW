/**
 * FlowOps ASL Generator Module
 * Compiles Intermediate Representation (IR) into Amazon States Language (ASL).
 */

import {
  IRGraph,
  IRNode,
  ASLStateMachine,
  ASLState,
  ASLChoiceRule,
} from './types';

export interface ASLCompilerOptions {
  httpExecutorArn?: string;
  approvalDispatcherArn?: string;
  defaultTimeoutSeconds?: number;
}

function sanitizeStateName(name: string, fallbackId: string): string {
  // Step Functions state names can be up to 80 characters, alphanumeric, hyphen, underscore
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 60);
  return cleaned && cleaned !== '_' ? `${cleaned}_${fallbackId.slice(0, 8)}` : `State_${fallbackId.slice(0, 8)}`;
}

export function compileToASL(
  ir: IRGraph,
  options: ASLCompilerOptions = {}
): ASLStateMachine {
  const httpExecutorArn = options.httpExecutorArn || '${HttpTaskExecutorLambdaArn}';
  const approvalDispatcherArn = options.approvalDispatcherArn || '${ApprovalDispatcherLambdaArn}';

  const stateNameMap = new Map<string, string>();
  for (const [id, node] of Object.entries(ir.nodes)) {
    stateNameMap.set(id, sanitizeStateName(node.label, id));
  }

  const states: Record<string, ASLState> = {};
  const startAt = stateNameMap.get(ir.entryNodeId) || 'Start';

  for (const [id, node] of Object.entries(ir.nodes)) {
    const stateName = stateNameMap.get(id)!;
    const nextStateName = node.next ? stateNameMap.get(node.next) : undefined;

    switch (node.type) {
      case 'TRIGGER_MANUAL':
      case 'TRIGGER_WEBHOOK': {
        const state: ASLState = {
          Type: 'Pass',
          Comment: `Entry Trigger: ${node.label}`,
        };
        if (nextStateName) {
          state.Next = nextStateName;
        } else {
          state.End = true;
        }
        states[stateName] = state;
        break;
      }

      case 'ACTION_HTTP': {
        const config = node.config;
        const state: ASLState = {
          Type: 'Task',
          Comment: `HTTP Action: ${node.label}`,
          Resource: 'arn:aws:states:::lambda:invoke',
          Parameters: {
            FunctionName: httpExecutorArn,
            Payload: {
              method: config.method || 'GET',
              url: config.url,
              headers: config.headers || { 'Content-Type': 'application/json' },
              body: config.body || null,
              'executionInput.$': '$',
            },
          },
          ResultPath: '$.httpResponse',
          TimeoutSeconds: node.timeoutSeconds || 30,
        };

        if (node.retryPolicy) {
          state.Retry = [
            {
              ErrorEquals: node.retryPolicy.errorEquals,
              IntervalSeconds: node.retryPolicy.intervalSeconds,
              MaxAttempts: node.retryPolicy.maxAttempts,
              BackoffRate: node.retryPolicy.backoffRate,
            },
          ];
        }

        if (nextStateName) {
          state.Next = nextStateName;
        } else {
          state.End = true;
        }
        states[stateName] = state;
        break;
      }

      case 'LOGIC_CONDITION': {
        const branches = node.branches;
        const trueTarget = branches?.trueNext ? stateNameMap.get(branches.trueNext) : undefined;
        const falseTarget = branches?.falseNext ? stateNameMap.get(branches.falseNext) : undefined;

        const choiceRule: ASLChoiceRule = {
          Variable: branches?.condition.variable || '$.httpResponse.Payload.statusCode',
          Next: trueTarget || 'State_End',
        };

        const val = branches?.condition.value;
        const op = branches?.condition.operator || 'equals';

        if (typeof val === 'number') {
          if (op === 'greater_than') choiceRule.NumericGreaterThan = val;
          else if (op === 'less_than') choiceRule.NumericLessThan = val;
          else choiceRule.NumericEquals = val;
        } else if (typeof val === 'boolean') {
          choiceRule.BooleanEquals = val;
        } else {
          choiceRule.StringEquals = String(val !== undefined ? val : '200');
        }

        const state: ASLState = {
          Type: 'Choice',
          Comment: `Condition Branch: ${node.label}`,
          Choices: [choiceRule],
          Default: falseTarget || trueTarget || 'State_End',
        };
        states[stateName] = state;
        break;
      }

      case 'CONTROL_WAIT': {
        const duration = Number(node.config.waitDurationSeconds) || 5;
        const state: ASLState = {
          Type: 'Wait',
          Comment: `Wait: ${node.label}`,
          Seconds: duration,
        };
        if (nextStateName) {
          state.Next = nextStateName;
        } else {
          state.End = true;
        }
        states[stateName] = state;
        break;
      }

      case 'CONTROL_APPROVAL': {
        const state: ASLState = {
          Type: 'Task',
          Comment: `Human Approval Gate: ${node.label}`,
          Resource: 'arn:aws:states:::lambda:invoke.waitForTaskToken',
          Parameters: {
            FunctionName: approvalDispatcherArn,
            Payload: {
              'taskToken.$': '$$.Task.Token',
              'executionId.$': '$$.Execution.Id',
              'workflowId.$': '$$.StateMachine.Name',
              title: node.config.approvalTitle || node.label,
              description: node.config.approvalDescription || '',
              assignedRole: node.config.assignedRole || 'OPERATOR',
              'contextPayload.$': '$',
            },
          },
          ResultPath: '$.approvalDecision',
          TimeoutSeconds: node.timeoutSeconds || 86400,
        };

        if (nextStateName) {
          state.Next = nextStateName;
        } else {
          state.End = true;
        }
        states[stateName] = state;
        break;
      }

      case 'CONTROL_SUCCESS': {
        states[stateName] = {
          Type: 'Succeed',
          Comment: `Terminal Success: ${node.label}`,
        };
        break;
      }

      case 'CONTROL_FAILURE': {
        states[stateName] = {
          Type: 'Fail',
          Comment: `Terminal Failure: ${node.label}`,
          Error: String(node.config.errorCode || 'WORKFLOW_EXECUTION_FAILED'),
          Cause: String(node.config.errorCause || 'Workflow encountered an intentional termination state.'),
        };
        break;
      }

      default: {
        const fallback: ASLState = {
          Type: 'Pass',
          Comment: `Pass fallback for ${node.label}`,
        };
        if (nextStateName) fallback.Next = nextStateName;
        else fallback.End = true;
        states[stateName] = fallback;
      }
    }
  }

  return {
    Comment: `FlowOps Generated Workflow: ${ir.name} (ID: ${ir.workflowId})`,
    StartAt: startAt,
    TimeoutSeconds: options.defaultTimeoutSeconds || 3600,
    States: states,
  };
}
