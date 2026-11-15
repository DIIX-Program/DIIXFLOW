# ADR 003: DynamoDB Single-Table Design with On-Demand Capacity

## Context
FlowOps manages multiple relational entities: Workspaces, Memberships, Workflows, Workflow Versions, Executions, and Approvals. Traditional relational databases (such as Amazon RDS Aurora PostgreSQL) incur ongoing minimum idle cluster costs ($40–$100+/month) and require VPC networking, subnet groups, and NAT gateways.

## Decision
We implement a **Single-Table Design** on **Amazon DynamoDB** (`flowops-main`) using On-Demand (`PAY_PER_REQUEST`) capacity:
- Generic partition key `PK` and sort key `SK`.
- Two Global Secondary Indexes (`GSI1` and `GSI2`) modeling all required access patterns (listing by status, querying executions by workflow, filtering approvals).
- Large payloads (graph JSON, ASL definitions, raw execution input/outputs > 64KB) are offloaded to Amazon S3, with object pointers stored in DynamoDB.

## Consequences
- **Positive**:
  - Zero base cost during idle or development periods.
  - Sub-10ms read and write latencies at any scale.
  - No VPC or NAT Gateway required, saving infrastructure overhead.
- **Negative / Mitigations**:
  - Complex schema evolution: Mitigated by strict Zod schema validation in the application layer and comprehensive test suites covering all access patterns.
