# FlowOps — Local Testing & Verification Guide

This document details the complete test suite for FlowOps, covering unit tests, compiler validation, SSRF security guards, cryptographic secrets management, and LocalStack integration tests.

---

## 1. Running Tests

### Full Test Suite (Recommended)
```bash
pnpm test
```
This runs all test suites sequentially using Node.js's native test runner (`node:test`):
1. `packages/workflow-compiler`: Validates ASL compilation, Kahn DAG cycle detection, and node schemas.
2. `tests/e2e-compiler.test.js`: Validates production-scale workflow compilation.
3. `packages/aws-adapter`: Validates SSRF prevention, AES-256-GCM encryption, S3 key paths, and configuration defaults.
4. `tests/localstack-integration.test.js`: Validates Step Functions publishing, branch conditions, retries, approval tickets, idempotency, and DynamoDB presence.

---

## 2. Test Suite Breakdown

### 2.1 Workflow Compiler & Validation Tests
File: `packages/workflow-compiler/dist/__tests__/compiler.test.js`
- **Test 1**: Sequential workflow compiles to valid Amazon States Language (ASL).
- **Test 2**: Branching workflow with Choice states and Human Approval gate compiles correctly.
- **Test 3**: Kahn's Topological Sort DAG algorithm detects circular loops and reports cycle nodes.
- **Test 4**: Disconnected/unreachable orphan nodes are flagged with validation errors.
- **Test 5**: Multiple triggers in a single workflow are rejected.
- **Test 6**: Node-specific validation schemas enforce required parameters (e.g. missing HTTP URL, missing operand).

### 2.2 Security & Adapter Tests
File: `packages/aws-adapter/dist/__tests__/aws-adapter.test.js`
- **Test 1 — SSRF Protection**:
  - Rejects IPv4 loopback (`127.0.0.1`, `127.0.0.2`).
  - Rejects IPv6 loopback (`::1`).
  - Rejects IPv4-mapped IPv6 addresses (`::ffff:127.0.0.1`, `::ffff:169.254.169.254`).
  - Rejects AWS Cloud Instance Metadata Service (IMDSv1/v2: `169.254.169.254`).
  - Rejects RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Disables automated HTTP redirect following (`redirect: 'manual'`) to prevent DNS rebinding bypasses.
  - Allows valid public HTTPS endpoints (`https://api.stripe.com`, `https://httpbin.org`).
- **Test 2 — Credential Service**:
  - Encrypts plaintext secrets with AES-256-GCM and random 12-byte initialization vectors (IVs).
  - Verifies cryptographic authentication tag integrity.
  - Decrypts ciphertext back to original plaintext.
  - Masks credentials for UI safe rendering (`sk_live_••••••••••••••••••••xxxx`).
- **Test 3 — S3 Artifact Service**:
  - Enforces tenant isolation in S3 key paths (`tenants/{tenantId}/workflows/...`).
  - Verifies consistent path formatting.
- **Test 4 — Environment Configuration**:
  - Confirms defaults fall back safely to `EXECUTION_PROVIDER=localstack` without requiring AWS credentials.

### 2.3 LocalStack Integration Tests
File: `tests/localstack-integration.test.js`
- **Test 1**: Sequential Workflow Compilation & Publishing Lifecycle (Step Functions).
- **Test 2**: Conditional Workflow with Branch Evaluation (`Choice` state with `Choices` array).
- **Test 3**: Step Functions Retry Exponential Backoff Configuration (`IntervalSeconds`, `MaxAttempts: 4`, `BackoffRate: 2.0`).
- **Test 4**: Permanent Failure Node Halts with Sanitized Error Details (`Fail` state with `Error` and `Cause`).
- **Test 5**: Human Approval `.waitForTaskToken` DynamoDB Lifecycle.
- **Test 6**: Execution Idempotency Guard (detects and returns existing execution for duplicated keys).
- **Test 7**: S3 Artifact Storage Tenant-Scoped Upload & Integrity check.
- **Test 8**: Presence Service with In-Memory TTL Expiration Filtering.

> [!NOTE]
> Tests 1, 5, 6, 7, and 8 detect whether LocalStack is running on port 4566. If LocalStack is stopped, they gracefully skip with an informative notice while tests 2, 3, and 4 verify compilation and schema logic. When `pnpm run local:up` is running, all 8 tests execute live against the emulator.

---

## 3. Smoke Testing LocalStack

To verify the state of a running LocalStack instance:
```bash
pnpm run local:smoke
```

Expected output when LocalStack is active:
```
====================================================
  FlowOps LocalStack Smoke Test Verification
  Endpoint: http://localhost:4566 | Region: ap-southeast-1
====================================================

[1/3] Testing S3 Artifact Bucket...
  [PASS] S3 bucket "flowops-artifacts-local" exists and is accessible.

[2/3] Testing DynamoDB Single-Table Schema...
  [PASS] DynamoDB table "flowops-main" status: ACTIVE
  [INFO] GSIs configured: 2

[3/3] Testing Step Functions State Machine Engine...
  [PASS] Step Functions active state machines: 1
```

If LocalStack is not yet running, the smoke test outputs:
```
[SKIPPED] LocalStack daemon is not running on port 4566.
To run this test live against LocalStack:
  pnpm run local:up
  pnpm run local:bootstrap
  pnpm run local:smoke
```
