# ADR 002: Utilization of AWS Step Functions Standard Mode

## Context
FlowOps supports long-running workflows, asynchronous human approvals that may pause for hours or days, automated retry policies with exponential backoff, and full execution history with per-step visual traces.

AWS offers two execution modes for Step Functions:
1. **Express Workflows**: Designed for high-volume, sub-second to 5-minute workloads. At-least-once execution. Does not support `.waitForTaskToken` callback patterns for human approvals. No native execution history console.
2. **Standard Workflows**: Exactly-once execution semantics. Can run for up to 1 year. Natively supports `.waitForTaskToken` callback task patterns. Full step-by-step visual execution history retained for 90 days.

## Decision
We select **AWS Step Functions Standard Workflows** as the core execution engine for FlowOps MVP.

## Consequences
- **Positive**:
  - Exactly-once execution prevents duplicate side effects in external APIs.
  - Native support for human approval gates via task tokens.
  - Native step-level execution inspection and retry mechanics without custom queuing code.
- **Negative / Mitigations**:
  - Cost per state transition ($0.025 per 1,000 transitions after 4,000 free transitions). For an average 5-node workflow, 10,000 executions cost ~$1.15. This is highly acceptable for enterprise automation.
