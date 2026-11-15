# FlowOps AWS Cost Estimation & FinOps Model

## 1. Cost Architecture & Philosophy

FlowOps is engineered with a **Serverless-First, Zero-Idle-Cost** model:
- **No idle servers or containers**: No Amazon ECS, EKS, or EC2 instances running when no workflows are executing.
- **No NAT Gateways**: In the MVP, task executors communicate directly with public APIs over standard serverless networking, avoiding ~$32.85/month per Availability Zone in idle VPC NAT Gateway fees.
- **Arm64 Graviton Runtimes**: 20% cheaper per GB-second than x86_64 architectures.
- **DynamoDB On-Demand**: Pay purely for actual read/write units consumed.

---

## 2. Monthly Cost Modeling by Scale (Region: ap-southeast-1)

### Scenario A: Starter / Developer Tier
- **Volume**: 10,000 workflow executions/month
- **Average steps per workflow**: 5 states
- **Total Step Functions state transitions**: 50,000

| Service | Usage Metric | Estimated Monthly Cost |
|---|---|---|
| **Amazon Cognito** | Up to 50,000 MAUs | $0.00 (AWS Free Tier) |
| **API Gateway (HTTP API)** | 100,000 requests | $0.10 |
| **AWS Lambda (Arm64)** | 60,000 invocations @ 256MB / 200ms | $0.00 (Free Tier 1M requests) |
| **AWS Step Functions** | 50,000 state transitions (4,000 free) | $1.15 |
| **Amazon DynamoDB** | 100,000 writes / 200,000 reads | $0.15 |
| **Amazon S3** | 5 GB storage + 20,000 PUT/GET requests | $0.18 |
| **Amazon CloudFront** | 10 GB data transfer out | $0.00 (Free Tier 1TB) |
| **CloudWatch Logs** | 1 GB ingestion | $0.50 |
| **TOTAL ESTIMATED MONTHLY COST** | | **~$2.08 / month** |

---

### Scenario B: Growth Tier (Mid-size SaaS Operations)
- **Volume**: 500,000 workflow executions/month
- **Average steps per workflow**: 5 states
- **Total Step Functions state transitions**: 2,500,000

| Service | Usage Metric | Estimated Monthly Cost |
|---|---|---|
| **Amazon Cognito** | 2,500 active users | $0.00 |
| **API Gateway (HTTP API)** | 3,000,000 requests | $3.00 |
| **AWS Lambda (Arm64)** | 2,800,000 invocations @ 384MB / 250ms | $4.40 |
| **AWS Step Functions** | 2,500,000 state transitions | $62.40 |
| **Amazon DynamoDB** | 5M writes / 10M reads | $7.25 |
| **Amazon S3** | 80 GB storage + requests | $2.40 |
| **Amazon CloudFront** | 80 GB transfer | $0.00 (Within 1TB free tier) |
| **CloudWatch Logs** | 15 GB ingestion | $8.25 |
| **TOTAL ESTIMATED MONTHLY COST** | | **~$87.70 / month** |

---

## 3. FinOps Optimization Levers

1. **Express Workflows Hybrid Mode (Future Roadmap)**: For high-volume, sub-second micro-integrations without human approvals, compile to Step Functions Express Workflows, reducing state transition costs by over 90%.
2. **S3 Payload Lifecycle**: Automatically transition execution traces to Glacier Instant Retrieval after 90 days.
3. **Pino Log Redaction & Level Tuning**: Suppress debug logs in production to maintain CloudWatch ingestion efficiency.
