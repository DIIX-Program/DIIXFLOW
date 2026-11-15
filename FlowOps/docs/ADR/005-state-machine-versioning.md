# ADR 005: State Machine Immutable Versioning Strategy

## Context
In production workflow automation, updating a workflow definition must never break in-flight executions or erase historical auditability. When an execution is triggered, it must run against the exact definition that was published at that moment, even if the workflow is updated minutes later.

## Decision
FlowOps enforces **Immutable Workflow Versions**:
1. Draft workflows are saved in DynamoDB and S3 with status `DRAFT`.
2. When a user clicks **Publish**, the graph is compiled into ASL, and a new AWS Step Functions state machine version is published using the Step Functions `PublishStateMachineVersion` API.
3. The resulting immutable version ARN (e.g. `arn:aws:states:...:stateMachine:order-flow:3`) is permanently recorded in DynamoDB under entity `WorkflowVersion`.
4. Triggering an execution starts the Step Functions execution against the specific version ARN, not an unversioned floating alias.

## Consequences
- **Positive**:
  - In-flight executions are never impacted by subsequent workflow edits.
  - Full reproducibility and compliance audit trails.
  - Safe rollback by re-aliasing or republishing previous version definitions.
- **Negative / Mitigations**:
  - AWS Step Functions retains up to 10,000 versions per state machine, which exceeds standard enterprise lifecycles. Older versions can be pruned via automated lifecycle jobs.
