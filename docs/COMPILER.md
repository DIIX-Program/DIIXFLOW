# FlowOps Workflow Compiler & ASL Specification

## 1. Compiler Architecture Overview

The FlowOps compiler is an independent, zero-network pure TypeScript package that transforms visual React Flow graphs into valid, production-ready **Amazon States Language (ASL)** definitions for AWS Step Functions.

```
React Flow Graph (Nodes & Edges)
               |
               v
     [ 1. Schema Validation ]       <-- Verifies JSON structure with Zod
               |
               v
     [ 2. Graph Validation ]        <-- DAG cycle detection, single root, reachability
               |
               v
 [ 3. Intermediate Representation ] <-- Normalized pipeline graph (IR)
               |
               v
     [ 4. ASL Generator ]           <-- Translates IR into Amazon States Language
               |
               v
  AWS Step Functions State Machine
```

---

## 2. Graph Validation Pipeline

Before any graph can be published or executed, it must pass a strict 7-phase validation suite:

1. **Unique Node IDs**: Asserts that every node key in the graph is distinct.
2. **Edge Integrity**: Asserts that every edge connects an existing `source` node to an existing `target` node.
3. **Single Entry Point**: Exactly one trigger node (`triggerManual` or `triggerWebhook`) must exist as the root of the workflow execution.
4. **DAG Cycle Detection (Kahn's Algorithm)**:
   - Computes in-degrees for all nodes $V$ and edges $E$.
   - Performs a topological sort in $O(V + E)$ time complexity.
   - If the count of visited nodes is less than $|V|$, a cycle exists and the compiler halts with error `GRAPH_CONTAINS_CYCLE`.
5. **Full Reachability**: Every node must be reachable via directed edges from the root trigger node. Disconnected orphan nodes fail validation.
6. **Branch Completeness**: Every `condition` node must have both `true` and `false` output branches connected to downstream nodes.
7. **Terminal State Verification**: All leaf nodes without outgoing edges must either be explicit terminal states (`controlSuccess`, `controlFailure`) or valid ending action nodes.

---

## 3. Node-to-ASL State Mapping Matrix

| FlowOps Visual Node | Step Functions State Type | ASL Resource / Configuration |
|---|---|---|
| **Manual Trigger** | Entry State | Ingests initial JSON event payload into `$` |
| **Webhook Trigger** | Entry State | Ingests webhook headers, query, and body |
| **HTTP Request** | `Task` | `arn:aws:states:::lambda:invoke` targeting the HTTP executor Lambda with retry policies |
| **Condition (IF)** | `Choice` | `Choice` rules (`StringEquals`, `NumericGreaterThan`, `BooleanEquals`) routing to branch states |
| **Wait** | `Wait` | `Seconds` (numeric seconds) or `TimestampPath` |
| **Approval Gate** | `Task` (`.waitForTaskToken`) | Invokes Approval Dispatcher Lambda with task token callback; pauses state machine until human signs off |
| **Success** | `Succeed` | Marks workflow execution as successfully finished |
| **Failure** | `Fail` | Marks workflow execution as failed with custom `Error` code and `Cause` string |

---

## 4. Intermediate Representation (IR) Data Structures

```typescript
export interface IRGraph {
  workflowId: string;
  name: string;
  version: number;
  entryNodeId: string;
  nodes: Record<string, IRNode>;
  edges: IREdge[];
}

export type IRNodeType = 
  | 'TRIGGER_MANUAL'
  | 'TRIGGER_WEBHOOK'
  | 'ACTION_HTTP'
  | 'LOGIC_CONDITION'
  | 'CONTROL_WAIT'
  | 'CONTROL_APPROVAL'
  | 'CONTROL_SUCCESS'
  | 'CONTROL_FAILURE';

export interface IRNode {
  id: string;
  type: IRNodeType;
  label: string;
  next?: string;
  branches?: {
    trueNext: string;
    falseNext: string;
    condition: IRConditionRule;
  };
  config: Record<string, any>;
  retryPolicy?: IRRetryPolicy;
  timeoutSeconds?: number;
}

export interface IRRetryPolicy {
  errorEquals: string[];
  intervalSeconds: number;
  maxAttempts: number;
  backoffRate: number;
}
```

---

## 5. Amazon States Language (ASL) Output Example

Below is the compiled ASL for a flow:
`Manual Trigger` -> `HTTP Request` -> `Condition (Status == 200)` -> `Approval Gate` -> `Success` / `Failure`.

```json
{
  "Comment": "FlowOps Compiled State Machine - Order Verification",
  "StartAt": "Start_Order_Flow",
  "States": {
    "Start_Order_Flow": {
      "Type": "Pass",
      "Next": "Verify_Payment"
    },
    "Verify_Payment": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "${HttpTaskExecutorArn}",
        "Payload": {
          "method": "POST",
          "url": "https://api.payment.internal/charges/verify",
          "headers": {
            "Content-Type": "application/json"
          },
          "data.$": "$"
        }
      },
      "ResultPath": "$.paymentResult",
      "Retry": [
        {
          "ErrorEquals": ["Lambda.ServiceException", "Lambda.AWSLambdaException", "States.Timeout"],
          "IntervalSeconds": 2,
          "MaxAttempts": 3,
          "BackoffRate": 2.0
        }
      ],
      "TimeoutSeconds": 15,
      "Next": "Check_Payment_Status"
    },
    "Check_Payment_Status": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.paymentResult.Payload.status",
          "StringEquals": "SUCCESS",
          "Next": "High_Value_Approval"
        }
      ],
      "Default": "Payment_Failed"
    },
    "High_Value_Approval": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
      "Parameters": {
        "FunctionName": "${ApprovalTaskDispatcherArn}",
        "Payload": {
          "taskToken.$": "$$.Task.Token",
          "executionId.$": "$$.Execution.Id",
          "title": "High Value Order Approval",
          "assignedRole": "FINANCE_LEAD",
          "orderData.$": "$.paymentResult.Payload"
        }
      },
      "ResultPath": "$.approvalResult",
      "TimeoutSeconds": 86400,
      "Next": "Order_Completed"
    },
    "Order_Completed": {
      "Type": "Succeed"
    },
    "Payment_Failed": {
      "Type": "Fail",
      "Error": "PAYMENT_VERIFICATION_FAILED",
      "Cause": "Payment provider rejected transaction or returned error status"
    }
  }
}
```
