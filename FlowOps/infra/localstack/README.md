# FlowOps LocalStack Infrastructure

This directory provides the Docker Compose definition and initialization hooks for running a local, offline, AWS-compatible cloud environment for **FlowOps**.

---

## 1. Prerequisites
- Docker Desktop installed and running on Windows.
- No AWS account or credit card required.
- Ports: `4566` must be free.

---

## 2. Starting LocalStack

From the project root:

```bash
# Start LocalStack container in the background
pnpm local:up

# View container logs
pnpm local:logs

# Check readiness and health
pnpm local:check

# Stop LocalStack container without deleting data
pnpm local:down
```

---

## 3. Services Emulated
- **Amazon S3**: Artifacts bucket (`flowops-artifacts-local`)
- **Amazon DynamoDB**: Single-table database (`flowops-main`) with GSI1, GSI2, and TTL
- **AWS Step Functions**: State machine creation, immutable versioning, and execution engine
- **AWS Lambda**: Node 22 task execution in isolated Docker containers on `flowops-network`
- **AWS IAM & STS**: Local dummy role & identity resolution

---

## 4. Networking Architecture
- **From Windows Host**:
  `http://localhost:4566`
- **From inside Docker Network (`flowops-network`)**:
  `http://localstack:4566`
- **Credentials**:
  - `AWS_ACCESS_KEY_ID=test`
  - `AWS_SECRET_ACCESS_KEY=test`
  - `AWS_DEFAULT_REGION=ap-southeast-1`
