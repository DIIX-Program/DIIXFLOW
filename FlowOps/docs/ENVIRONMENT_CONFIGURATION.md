# FlowOps — Environment Configuration Reference

This document provides a comprehensive reference of all environment variables used across the FlowOps monorepo.

---

## 1. Quick Setup

FlowOps ships with template environment files:
- `.env.example`: Reference for root monorepo.
- `.env.local.example`: Template for local offline development with LocalStack.

To set up your local development environment:
```bash
cp .env.local.example .env.local
```

FlowOps automatically loads `.env.local` when present, falling back to safe local defaults if no environment file exists.

---

## 2. Environment Variables Reference

### 2.1 Execution & Cloud Provider

| Variable | Description | Default (Local) | Production Example |
| :--- | :--- | :--- | :--- |
| `EXECUTION_PROVIDER` | Determines whether to target LocalStack or real AWS. Allowed: `localstack`, `aws`. | `localstack` | `aws` |
| `LOCALSTACK_ENDPOINT` | HTTP edge endpoint for LocalStack emulator. | `http://localhost:4566` | *Unset in production* |
| `AWS_REGION` | Target AWS geographic region. | `ap-southeast-1` | `ap-southeast-1` |
| `AWS_ACCOUNT_ID` | 12-digit AWS account ID. | `000000000000` | `123456789012` |

---

### 2.2 AWS Credentials (Local vs. Cloud)

| Variable | Description | Default (Local) | Production |
| :--- | :--- | :--- | :--- |
| `AWS_ACCESS_KEY_ID` | AWS access key identifier. | `test` | Provided via IAM Role / ECS Task Role |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key. | `test` | Provided via IAM Role / ECS Task Role |
| `AWS_SESSION_TOKEN` | Optional STS session token for temporary credentials. | *Unset* | Injected by AWS STS |

> [!NOTE]
> In LocalStack mode (`EXECUTION_PROVIDER=localstack`), dummy credentials (`test`/`test`) are automatically used. Do **NOT** provide real AWS credentials for local development.

---

### 2.3 Storage & Database Services

| Variable | Description | Default (Local) | Production Example |
| :--- | :--- | :--- | :--- |
| `DYNAMODB_TABLE_NAME` | Name of the DynamoDB Single-Table database. | `flowops-main` | `flowops-production-main` |
| `S3_BUCKET_ARTIFACTS` | S3 bucket storing workflow graph states, ASL definitions, and execution traces. | `flowops-artifacts-local` | `flowops-artifacts-123456789012-ap-southeast-1` |

---

### 2.4 Security & Cryptography

| Variable | Description | Default (Local) | Production Requirements |
| :--- | :--- | :--- | :--- |
| `MASTER_ENCRYPTION_KEY` | 32-byte hex string (64 characters) used for AES-256-GCM symmetric encryption of third-party API credentials and webhook tokens. | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | 64-char cryptographically random hex key or AWS KMS Key ARN |
| `NODE_ENV` | Application runtime environment. Allowed: `development`, `production`, `test`. | `development` | `production` |

---

### 2.5 REST API & Frontend Web

| Variable | Description | Default (Local) | Production Example |
| :--- | :--- | :--- | :--- |
| `PORT` | TCP port for the `@flowops/api` backend HTTP server. | `4000` | `4000` |
| `NEXT_PUBLIC_API_URL` | Base URL used by the `@flowops/web` client to communicate with the REST API. | `http://localhost:4000` | `https://api.flowops.cloud` |
| `NEXT_PUBLIC_APP_URL` | Canonical URL of the Next.js web application. | `http://localhost:3000` | `https://app.flowops.cloud` |
| `NEXT_PUBLIC_WORKSPACE_ID` | Default workspace tenant ID for local sessions. | `ws-core-enterprise` | Dynamic per authenticated tenant |

---

## 3. Sample `.env.local`

```bash
# FlowOps LocalStack Environment Configuration
NODE_ENV=development
EXECUTION_PROVIDER=localstack
LOCALSTACK_ENDPOINT=http://localhost:4566
AWS_REGION=ap-southeast-1
AWS_ACCOUNT_ID=000000000000

# Dummy AWS credentials for LocalStack
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Service Names
DYNAMODB_TABLE_NAME=flowops-main
S3_BUCKET_ARTIFACTS=flowops-artifacts-local

# AES-256-GCM Key (64 hex characters)
MASTER_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Ports & URLs
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WORKSPACE_ID=ws-core-enterprise
```
