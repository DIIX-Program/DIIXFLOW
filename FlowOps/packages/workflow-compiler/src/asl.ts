import {
  IRGraph,
  IRNode,
  ASLStateMachine,
  ASLState,
  ASLTaskState,
  ASLPassState,
  ASLChoiceState,
  ASLWaitState,
  ASLSucceedState,
  ASLFailState,
  ASLChoiceRule,
} from '@flowops/contracts';

export interface ASLCompilationOptions {
  stateMachineArnPrefix?: string;
  defaultHttpLambdaArn?: string;
  approvalDispatcherLambdaArn?: string;
  timeoutSeconds?: number;
}

const getAccountId = () =>
  process.env.AWS_ACCOUNT_ID ||
  (process.env.EXECUTION_PROVIDER === 'aws' ? '123456789012' : '000000000000');

const getRegion = () =>
  process.env.LOCALSTACK_REGION || process.env.AWS_REGION || 'ap-southeast-1';

export const getDefaultHttpExecutorArn = () =>
  process.env.HTTP_EXECUTOR_LAMBDA_ARN ||
  `arn:aws:lambda:${getRegion()}:${getAccountId()}:function:flowops-http-executor`;

export const getDefaultApprovalDispatcherArn = () =>
  process.env.APPROVAL_DISPATCHER_LAMBDA_ARN ||
  `arn:aws:lambda:${getRegion()}:${getAccountId()}:function:flowops-approval-dispatcher`;

/**
 * Compiles a canonical IRGraph into a valid Amazon States Language (ASL) State Machine JSON definition.
 */
export function generateASL(
  ir: IRGraph,
  options: ASLCompilationOptions = {}
): ASLStateMachine {
  const states: Record<string, ASLState> = {};
  const httpLambdaArn = options.defaultHttpLambdaArn || getDefaultHttpExecutorArn();
  const approvalLambdaArn =
    options.approvalDispatcherLambdaArn || getDefaultApprovalDispatcherArn();

  for (const [canonicalId, irNode] of ir.nodes.entries()) {
    states[canonicalId] = mapIRNodeToASLState(irNode, {
      httpLambdaArn,
      approvalLambdaArn,
    });
  }

  return {
    Comment: `FlowOps Generated Workflow: ${ir.name} (${ir.workflowId})`,
    StartAt: ir.entryNodeId,
    Version: '1.0',
    TimeoutSeconds: options.timeoutSeconds || 86400, // 24 hours max standard
    States: states,
  };
}

function mapIRNodeToASLState(
  irNode: IRNode,
  config: { httpLambdaArn: string; approvalLambdaArn: string }
): ASLState {
  switch (irNode.type) {
    case 'TRIGGER_MANUAL':
    case 'TRIGGER_WEBHOOK': {
      // Triggers compile to a Pass state in Step Functions that forwards or initializes payload
      const passState: ASLPassState = {
        Type: 'Pass',
        ResultPath: '$.triggerOutput',
        Comment: `Trigger: ${irNode.label}`,
      };

      if (irNode.next) {
        passState.Next = irNode.next;
      } else {
        passState.End = true;
      }
      return passState;
    }

    case 'ACTION_HTTP': {
      const taskState: ASLTaskState = {
        Type: 'Task',
        Resource: 'arn:aws:states:::lambda:invoke',
        Parameters: {
          FunctionName: config.httpLambdaArn,
          Payload: {
            method: irNode.parameters.method || 'GET',
            url: irNode.parameters.url,
            headers: irNode.parameters.headers || {},
            body: irNode.parameters.body,
            timeoutSeconds: irNode.parameters.timeoutSeconds || 30,
          },
        },
        ResultPath: `$.results.${irNode.canonicalId}`,
        TimeoutSeconds: Number(irNode.parameters.timeoutSeconds) || 30,
        Comment: `HTTP Action: ${irNode.label}`,
      };

      if (irNode.retry) {
        taskState.Retry = irNode.retry.map((r) => ({
          ErrorEquals: r.errorEquals,
          IntervalSeconds: r.intervalSeconds,
          MaxAttempts: r.maxAttempts,
          BackoffRate: r.backoffRate,
        }));
      }

      if (irNode.next) {
        taskState.Next = irNode.next;
      } else {
        taskState.End = true;
      }
      return taskState;
    }

    case 'LOGIC_CONDITION': {
      const { leftOperand, operator, rightOperand } = irNode.parameters;
      const trueNext = irNode.branches?.trueNext;
      const falseNext = irNode.branches?.falseNext;

      const choiceRule: ASLChoiceRule = {
        Variable: (leftOperand as string) || '$.status',
        Next: trueNext || '',
      };

      // Map operator to ASL Choice Operator
      if (operator === 'equals') {
        if (typeof rightOperand === 'number') {
          choiceRule.NumericEquals = rightOperand;
        } else if (typeof rightOperand === 'boolean') {
          choiceRule.BooleanEquals = rightOperand;
        } else {
          choiceRule.StringEquals = String(rightOperand ?? '');
        }
      } else if (operator === 'greater_than') {
        choiceRule.NumericGreaterThan = Number(rightOperand) || 0;
      } else if (operator === 'less_than') {
        choiceRule.NumericLessThan = Number(rightOperand) || 0;
      } else if (operator === 'contains') {
        choiceRule.StringMatches = `*${rightOperand}*`;
      } else {
        choiceRule.StringEquals = String(rightOperand ?? '');
      }

      const choiceState: ASLChoiceState = {
        Type: 'Choice',
        Choices: [choiceRule],
        Default: falseNext,
        Comment: `Condition: ${irNode.label}`,
      };

      return choiceState;
    }

    case 'CONTROL_APPROVAL': {
      // Step Functions .waitForTaskToken callback task pattern
      const approvalState: ASLTaskState = {
        Type: 'Task',
        Resource: 'arn:aws:states:::lambda:invoke.waitForTaskToken',
        Parameters: {
          FunctionName: config.approvalLambdaArn,
          Payload: {
            'taskToken.$': '$$.Task.Token',
            'executionId.$': '$$.Execution.Id',
            'workflowId.$': '$$.StateMachine.Id',
            title: irNode.parameters.approvalTitle,
            assignedRole: irNode.parameters.assignedRole || 'ADMIN',
            'contextPayload.$': '$',
          },
        },
        ResultPath: `$.approvals.${irNode.canonicalId}`,
        TimeoutSeconds: (Number(irNode.parameters.timeoutHours) || 72) * 3600,
        Comment: `Human Approval Gate: ${irNode.label}`,
      };

      if (irNode.next) {
        approvalState.Next = irNode.next;
      } else {
        approvalState.End = true;
      }

      return approvalState;
    }

    case 'CONTROL_WAIT': {
      const waitState: ASLWaitState = {
        Type: 'Wait',
        Seconds: Number(irNode.parameters.waitSeconds) || 60,
        Comment: `Wait: ${irNode.label}`,
      };

      if (irNode.next) {
        waitState.Next = irNode.next;
      } else {
        waitState.End = true;
      }
      return waitState;
    }

    case 'CONTROL_SUCCESS': {
      const succeedState: ASLSucceedState = {
        Type: 'Succeed',
        Comment: `Success: ${irNode.label}`,
      };
      return succeedState;
    }

    case 'CONTROL_FAILURE': {
      const failState: ASLFailState = {
        Type: 'Fail',
        Error: (irNode.parameters.errorCode as string) || 'FLOWOPS_ERROR',
        Cause: (irNode.parameters.errorCause as string) || 'Execution halted by failure node',
        Comment: `Fail: ${irNode.label}`,
      };
      return failState;
    }

    default:
      return {
        Type: 'Succeed',
      };
  }
}
