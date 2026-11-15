# FlowOps — AI-Powered Cloud Workflow Orchestration Platform

FlowOps is a production-grade, AWS-native cloud workflow automation platform engineered for mission-critical reliability, deterministic execution, and real-time team collaboration.

FlowOps combines an industrial enterprise visual design system (inspired by **Gustra**'s layout hierarchy, ambient stone canvas `#f0f0ee`, and hairline borders) with the workflow interaction patterns of modern node graph editors (inspired by **n8n**), backed by an independently implemented serverless compilation engine targeting **AWS Step Functions Standard**, **AWS Lambda (Node 22 ARM64 Graviton)**, **Amazon DynamoDB**, and **Amazon S3**.

---

## 1. Monorepo Architecture

```
FlowOps/
├── apps/
│   ├── web/                    # Next.js 16 + React 19 visual workflow studio & enterprise dashboard
│   └── api/                    # Serverless API handlers, SSRF-resistant HTTP executor, and approval callbacks
│
├── packages/
│   ├── contracts/              # Pure TypeScript type contracts, IR, ASL schemas, and domain models
│   ├── workflow-core/          # Graph topology validation (Kahn's DAG cycle detection) & IR generator
│   ├── workflow-compiler/      # Pure ASL code generator producing Amazon States Language JSON
│   └── aws-adapter/            # AWS SDK v3 clients (Step Functions, DynamoDB single-table, S3)
│
├── infra/
│   └── cdk/                    # AWS CDK TypeScript infrastructure (ap-southeast-1)
│
├── docs/
│   ├── references/             # Design & backend reference research analyses
│   ├── architecture/           # Full technical specifications (Architecture, Database, API, Compiler, etc.)
│   ├── ADR/                    # Architectural Decision Records (001–005)
│   └── PROJECT_STRUCTURE.md    # Definitive project layout & dependency boundaries
│
├── tests/                      # Monorepo integration and end-to-end compiler verification tests
├── package.json                # Monorepo root manifest
├── pnpm-workspace.yaml         # PNPM workspace definition
├── README.md                   # Project overview & quickstart
├── .gitignore                  # Git ignore rules
└── .env.example                # Environment variable specification
```

---

## 2. Quickstart

### Prerequisites
- Node.js >= 20.x (Node 22+ recommended)
- pnpm >= 9.x (`npm install -g pnpm`)
- AWS CLI configured for `ap-southeast-1`

### Installation & Build
```bash
# Install all dependencies across the workspace
pnpm install

# Build all packages and applications
pnpm build

# Run full test suite (compiler, security, e2e, and integration)
pnpm test

# Synthesize AWS CloudFormation templates via CDK
pnpm synth
```

### Local Development with LocalStack (No AWS Account Required)
```bash
# 1. Check Docker & LocalStack readiness
pnpm run local:check

# 2. Start LocalStack emulator container
pnpm run local:up

# 3. Provision S3 buckets, DynamoDB single-table schema, and default seeds
pnpm run local:bootstrap

# 4. Deploy Lambda executor functions to LocalStack
pnpm run local:deploy

# 5. Start Next.js Web (:3000) and REST API (:4000)
pnpm run dev:all
```

---

## 3. Core Capabilities

1. **Visual Workflow Studio (`apps/web`)**:
   - React Flow node-graph canvas with `@magicui/dot-pattern` ambient backdrop.
   - High-value action triggers with `@magicui/shimmer-button` ("Publish to AWS", "Run Workflow").
   - Live multi-user collaboration presence powered by `@magicui/avatar-circles` and DynamoDB TTL heartbeats.
   - Canvas and node context menus powered by `@microkit/blur-glide-menu`.
   - Node-level execution drawer (NDV), hourly throughput charts, and human approval inbox.

2. **Topological Graph Validation (`packages/workflow-core`)**:
   - Kahn's algorithm for $O(V+E)$ DAG cycle detection.
   - Enforces single entry root trigger and terminal completeness across all conditional branches.

3. **Pure TypeScript Compiler (`packages/workflow-compiler`)**:
   - Maps React Flow visual nodes to standard Amazon States Language (ASL).
   - Generates immutable state machines with versioned ARNs.

4. **Security & Human-in-the-Loop (`packages/aws-adapter` & `apps/api`)**:
   - SSRF protection: DNS-level pre-flight IP validation blocking AWS Instance Metadata (`169.254.169.254`), loopback, and RFC 1918 private subnets.
   - Disables automated redirect following (`redirect: 'manual'`) to prevent DNS rebinding attacks.
   - Step Functions `.waitForTaskToken` approval gates with DynamoDB token persistence.
   - AES-256-GCM authenticated encryption for credential storage.

---

## 4. Documentation Index

- [Local Development Guide](file:///d:/Project/DIIXFLOW/FlowOps/docs/LOCAL_DEVELOPMENT.md) — Setup with Docker Desktop and LocalStack
- [LocalStack Architecture](file:///d:/Project/DIIXFLOW/FlowOps/docs/LOCALSTACK.md) — Service emulation, S3 addressing, and DynamoDB TTL
- [Local Testing Guide](file:///d:/Project/DIIXFLOW/FlowOps/docs/LOCAL_TESTING.md) — Running unit, e2e, and integration tests
- [Environment Configuration](file:///d:/Project/DIIXFLOW/FlowOps/docs/ENVIRONMENT_CONFIGURATION.md) — Complete environment variables reference
- [Real AWS Cloud Verification Checklist](file:///d:/Project/DIIXFLOW/FlowOps/docs/CLOUD_VERIFICATION_CHECKLIST.md) — Migration to real AWS
- [Project Structure & Isolation Guide](file:///d:/Project/DIIXFLOW/FlowOps/docs/PROJECT_STRUCTURE.md)
- [System Architecture Specification](file:///d:/Project/DIIXFLOW/FlowOps/docs/architecture/ARCHITECTURE.md)
- [DynamoDB Single-Table Design](file:///d:/Project/DIIXFLOW/FlowOps/docs/architecture/DATABASE.md)
- [Compiler & ASL Specification](file:///d:/Project/DIIXFLOW/FlowOps/docs/architecture/COMPILER.md)
- [Security Model & Threat Matrix](file:///d:/Project/DIIXFLOW/FlowOps/docs/architecture/SECURITY.md)
- [System Architecture](file:///d:/Project/DIIXFLOW/FlowOps/docs/architecture/ARCHITECTURE.md)
- [DynamoDB Single-Table Schema](file:///d:/Project/DIIXFLOW/FlowOps/docs/architecture/DATABASE.md)
- [Compiler Specification](file:///d:/Project/DIIXFLOW/FlowOps/docs/architecture/COMPILER.md)
- [Security & SSRF Mitigation](file:///d:/Project/DIIXFLOW/FlowOps/docs/architecture/SECURITY.md)
- [Architectural Decision Records (ADRs)](file:///d:/Project/DIIXFLOW/FlowOps/docs/ADR)
