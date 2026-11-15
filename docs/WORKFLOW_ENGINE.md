# FlowOps Workflow Execution Engine Specification

## 1. Engine Architecture & Lifecycle Overview

The FlowOps workflow engine is built around a clear separation between **Design Time** and **Execution Time**:

```
[ Visual Canvas Design ]  (@xyflow/react)
            |
            v
[ Graph Validation ]      (Kahn's Algorithm O(V+E), Root Check, Reachability)
            |
            v
[ Intermediate Rep ]      (Canonical DAG IR)
            |
            v
[ ASL Compiler ]          (Amazon States Language Generator)
            |
            v
[ Publish to AWS ]        (AWS Step Functions PublishStateMachineVersion)
            |
            v
[ Execution Engine ]      (AWS Step Functions Standard + Lambda Executors)
            |
            v
[ Observability ]         (Real-time State Sync, Node Payloads & Traces)
```

---

## 2. Publish Lifecycle & Immutable Versioning

Publishing a workflow transforms client-side visual graph JSON into an immutable AWS cloud resource:

1. **Graph Serialization**: Extracts nodes, edges, and configurations from React Flow state.
2. **Topological Graph Validation**:
   - Asserts exactly one trigger node (`triggerManual` or `triggerWebhook`).
   - Executes Kahn's topological sort algorithm to verify $O(V+E)$ DAG acyclicity.
   - Verifies reachability of all nodes from the entry root.
   - Validates condition branches (`True` and `False` outgoing handles connected).
3. **IR Generation**: Transforms UI nodes into canonical `IRNode` entities with typed input/output bindings, retry policies, and timeout specifications.
4. **ASL Compilation**: Generates an Amazon States Language JSON document compliant with Step Functions specifications.
5. **State Machine Creation / Update**:
   - If state machine exists: calls Step Functions `UpdateStateMachine`.
   - Calls `PublishStateMachineVersion` to lock the definition into an immutable version ARN (e.g. `:5`).
6. **Artifact Storage**:
   - Stores full React Flow graph snapshot in S3: `workflows/{id}/versions/v{n}/graph.json`.
   - Stores ASL definition in S3: `workflows/{id}/versions/v{n}/definition.asl.json`.
7. **Metadata Persistence**: Records version record in DynamoDB table `flowops-main` under `WORKFLOW#{id}` / `VERSION#{n}`.

---

## 3. Execution Lifecycle

Triggering an execution:

1. **Invocation**: A webhook POST arrives at API Gateway, or an authorized operator clicks **Run Workflow**.
2. **Authorization & Tenant Verification**:
   - Verifies JWT token and workspace membership.
   - Validates that caller holds `RUNNER`, `EDITOR`, or `ADMIN` role.
3. **Version Resolution**: Fetches the active published `stateMachineVersionArn`. Executions are never started against unversioned floating aliases.
4. **Execution Start**:
   - Invokes Step Functions `StartExecutionCommand(stateMachineVersionArn, executionName, inputPayload)`.
   - An idempotency key (`req-...`) prevents duplicate starts during network retries.
5. **Task Execution**:
   - Step Functions invokes Lambda task executors (`httpTaskExecutor`) with input payloads.
   - Automatic exponential retry policies handle transient network timeouts.
6. **Human-in-the-Loop Pausing**:
   - When encountering an Approval Gate, Step Functions enters `.waitForTaskToken`.
   - Execution state pauses at $0 compute cost while an alert appears in the FlowOps Approval Inbox.
   - Decision triggers `SendTaskSuccess`, resuming the state machine to the next state.
7. **Result Ingestion**:
   - Execution finishes in `SUCCEEDED`, `FAILED`, or `TIMED_OUT`.
   - Per-node execution trace is recorded and available for visual inspection in the FlowOps console.
