# FlowOps Node Settings & Step Functions Mapping

Every node in FlowOps exposes a dedicated **Settings Tab** within the Node Details View (NDV), allowing engineers to tune execution resilience, retry policies, timeouts, and error handling policies.

---

## 1. Node Execution Settings Schema

```typescript
export interface NodeExecutionSettings {
  retryOnFail?: boolean;           // Enable automated Step Functions Retrier
  maxRetries?: number;             // Max retry attempts (Default: 3, Max: 10)
  backoffRate?: number;            // Exponential backoff multiplier (Default: 2.0)
  intervalSeconds?: number;        // Initial backoff wait time in seconds (Default: 2)
  timeoutSeconds?: number;         // Task state timeout (Default: 300)
  heartbeatSeconds?: number;       // SFN Heartbeat check for long-running tasks
  onErrorPolicy?: 'STOP' | 'CONTINUE' | 'FALLBACK'; // Action on terminal error
  fallbackNodeId?: string;         // Target node when onErrorPolicy is FALLBACK
  redactParameters?: boolean;      // Mask node parameters in execution history logs
  notes?: string;                  // Architect annotations attached to node
}
```

---

## 2. Compilation to Amazon States Language (ASL)

When a node with custom settings is compiled into an AWS Step Functions `Task` state, the compiler translates these settings directly into valid ASL blocks:

### Input Node Settings
```json
{
  "retryOnFail": true,
  "maxRetries": 3,
  "intervalSeconds": 2,
  "backoffRate": 2.0,
  "timeoutSeconds": 30,
  "onErrorPolicy": "FALLBACK",
  "fallbackNodeId": "action_notify_ops"
}
```

### Generated ASL State Definition
```json
"HttpPaymentVerification": {
  "Type": "Task",
  "Resource": "arn:aws:states:::http:invoke",
  "TimeoutSeconds": 30,
  "Retry": [
    {
      "ErrorEquals": ["States.Http.StatusCode.5XX", "States.Timeout"],
      "IntervalSeconds": 2,
      "MaxAttempts": 3,
      "BackoffRate": 2.0
    }
  ],
  "Catch": [
    {
      "ErrorEquals": ["States.ALL"],
      "Next": "action_notify_ops",
      "ResultPath": "$.errorInfo"
    }
  ],
  "Next": "ProcessSuccessResult"
}
```

---

## 3. On-Error Policy Semantics

- **`STOP` (Default)**: The state machine immediately halts upon uncaught error, entering `FAILED` status and triggering CloudWatch alerts.
- **`CONTINUE`**: The error is captured into `$.errorInfo` and execution advances to the default next node in the sequence.
- **`FALLBACK`**: The compiler creates a dedicated Step Functions `Catch` block routing execution directly to the designated fallback node ID (e.g., Slack alert, dead-letter queue).
