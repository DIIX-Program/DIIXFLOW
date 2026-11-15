# FlowOps — Real AWS Cloud Verification & Migration Checklist

When transitioning from the **LocalStack** emulator to a real **AWS Cloud** account, follow this checklist to ensure security, compliance, and zero downtime.

---

## Pre-Flight Checklist

### 1. AWS Account & CLI Credentials
- [ ] Create AWS Account (or sign in to designated organization account).
- [ ] Configure AWS CLI v2:
  ```bash
  aws configure --profile flowops-prod
  # AWS Access Key ID [***]: <ENTER_PROD_KEY>
  # AWS Secret Access Key [***]: <ENTER_PROD_SECRET>
  # Default region name [ap-southeast-1]: ap-southeast-1
  # Default output format [json]: json
  ```
- [ ] Verify identity:
  ```bash
  aws sts get-caller-identity --profile flowops-prod
  ```

### 2. CDK Environment Bootstrap
- [ ] Run CDK bootstrap in the target region (`ap-southeast-1`):
  ```bash
  cd infra/cdk
  npx cdk bootstrap aws://<YOUR_ACCOUNT_ID>/ap-southeast-1 --profile flowops-prod
  ```

---

## Infrastructure Deployment Checklist

### 3. Deploy CDK Production Stack
- [ ] Synthesize CloudFormation template:
  ```bash
  pnpm run synth
  ```
- [ ] Deploy stack:
  ```bash
  cd infra/cdk
  npx cdk deploy FlowOpsProductionStack --profile flowops-prod
  ```
- [ ] Note the CloudFormation Stack Outputs:
  - `DynamoDBTableName`
  - `S3ArtifactsBucketName`
  - `CognitoUserPoolId`
  - `CognitoClientId`
  - `ApiGatewayUrl`
  - `HttpExecutorArn`

---

## Security Verification Checklist

### 4. DynamoDB Single-Table Security
- [ ] Verify Server-Side Encryption (SSE) is enabled using AWS KMS / AWS owned keys.
- [ ] Verify Point-in-Time Recovery (PITR) is active for ransomware protection.
- [ ] Confirm TTL attribute is configured on column `ttl`.
- [ ] Check IAM least-privilege policy: ensure application roles have access ONLY to `flowops-main` and its GSIs (`GSI1`, `GSI2`).

### 5. S3 Artifact Bucket Hardening
- [ ] Verify Public Access Block is `true` for all 4 flags:
  - `BlockPublicAcls: true`
  - `IgnorePublicAcls: true`
  - `BlockPublicPolicy: true`
  - `RestrictPublicBuckets: true`
- [ ] Verify S3 Bucket Policy denies any non-TLS traffic (`aws:SecureTransport: "false"`).
- [ ] Verify S3 Versioning is enabled.
- [ ] Verify lifecycle rule transitions old execution traces (`executions/*`) to `GLACIER_IR` after 90 days.

### 6. KMS & Secrets Management
- [ ] Create a customer-managed KMS key in AWS KMS:
  ```bash
  aws kms create-key --description "FlowOps Master Credential Key" --profile flowops-prod
  ```
- [ ] Store the AES-256 master encryption key or KMS Key ARN in AWS Secrets Manager or SSM Parameter Store.
- [ ] Grant `kms:Decrypt` and `kms:GenerateDataKey` permissions only to the API backend role.

### 7. Step Functions IAM Role
- [ ] Confirm `FlowOpsStepFunctionsExecutionRole` has trust relationship for `states.amazonaws.com`.
- [ ] Verify role only has `lambda:InvokeFunction` permissions for the specific FlowOps Lambda ARNs (`flowops-http-executor`, `flowops-approval-dispatcher`).

---

## Application Configuration Checklist

### 8. Update Production Environment
- [ ] Set `EXECUTION_PROVIDER=aws`.
- [ ] Remove `LOCALSTACK_ENDPOINT`.
- [ ] Set `AWS_REGION=ap-southeast-1`.
- [ ] Set `AWS_ACCOUNT_ID=<YOUR_ACCOUNT_ID>`.
- [ ] Set `DYNAMODB_TABLE_NAME=<OUTPUT_TABLE_NAME>`.
- [ ] Set `S3_BUCKET_ARTIFACTS=<OUTPUT_BUCKET_NAME>`.
- [ ] Set `MASTER_ENCRYPTION_KEY=<PROD_64_CHAR_HEX_KEY>`.
- [ ] Deploy `@flowops/web` to AWS Amplify / Vercel / CloudFront + S3.
- [ ] Deploy `@flowops/api` to AWS ECS Fargate or Lambda Function URL.

---

## Live End-to-End Smoke Test Checklist

### 9. Production Verification
- [ ] Sign in via Cognito User Pool with MFA enabled.
- [ ] Create test workflow in visual editor.
- [ ] Click **Publish to AWS** -> verify Step Functions state machine created in AWS Console.
- [ ] Trigger test execution -> verify Step Functions execution console shows active transition.
- [ ] Test Human Approval node -> verify state machine pauses on `.waitForTaskToken` and resumes upon UI approval.
- [ ] Verify CloudWatch Logs are populated with structured logs.
- [ ] Verify S3 artifacts are stored at `tenants/{tenantId}/workflows/...`.
