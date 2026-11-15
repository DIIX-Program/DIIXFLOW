# FlowOps Project Structure & Isolation Specification

This document details the definitive directory structure, module locations, dependency isolation boundaries, local development workflows, and build pipelines for **FlowOps**.

---

## 1. Directory Tree & Roles

```
FlowOps/
├── apps/
│   ├── web/                         # Next.js 16 + React 19 Frontend Web Application
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router (Dashboard, Workflows, Editor, Executions, Approvals, Connections)
│   │   │   ├── components/
│   │   │   │   ├── layout/          # AppShell, Rail Sidebar, Topbar
│   │   │   │   ├── workflow-editor/ # React Flow custom nodes, NDV Drawer, Bottom Execution Panel
│   │   │   │   ├── microkit/        # @microkit/blur-glide-menu for context menus
│   │   │   │   └── ui/              # Magic UI & shadcn primitives (DotPattern, ShimmerButton, TextAnimate, etc.)
│   │   │   ├── lib/                 # Client utilities, mock data, team presence store
│   │   │   └── styles/              # Design tokens (Gustra-inspired CSS custom properties)
│   │   ├── public/                  # Static assets & brand icons
│   │   ├── package.json             # Web package dependencies
│   │   └── tsconfig.json
│   │
│   └── api/                         # Node.js / Lambda Backend Handlers & Dev Server
│       ├── src/
│       │   ├── handlers/            # httpTaskExecutor, approvalDispatcher, approvalCallback
│       │   ├── server.ts            # Local development HTTP server
│       │   └── index.ts             # AWS Lambda exports
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── contracts/                   # Shared TypeScript Schemas & Interfaces
│   │   ├── src/index.ts             # Domain models, Graph, IR, ASL, and DynamoDB schemas
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── workflow-core/               # Pure Topology & Graph Analysis
│   │   ├── src/
│   │   │   ├── validation.ts        # Kahn's DAG cycle detection O(V+E), reachability, branch validation
│   │   │   ├── ir.ts                # Intermediate Representation (IR) canonical DAG builder
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── workflow-compiler/           # Pure TypeScript ASL Compiler
│   │   ├── src/
│   │   │   ├── asl.ts               # Amazon States Language JSON generator
│   │   │   ├── compiler.ts          # Orchestrator (validate -> IR -> ASL)
│   │   │   ├── __tests__/           # Unit test suite (6 tests)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── aws-adapter/                 # AWS SDK v3 Clients & Infrastructure Wrappers
│       ├── src/
│       │   ├── httpExecutor.ts      # SSRF-blocking pre-flight DNS validator & HTTP executor
│       │   ├── stepFunctions.ts     # Step Functions execution management & task token resolutions
│       │   ├── dynamoDb.ts          # Single-table DocumentClient helpers & presence TTL
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── infra/
│   └── cdk/                         # AWS CDK TypeScript Stack
│       ├── bin/flowops-app.ts       # CDK App Entrypoint (ap-southeast-1)
│       ├── lib/flowops-stack.ts     # CloudFormation infrastructure definition
│       ├── cdk.json
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   ├── references/                  # Reference research analyses (Gustra UI, n8n backend, comparative decisions)
│   ├── architecture/                # System architecture, DB schema, API, Security, Deployment specifications
│   ├── ADR/                         # Architectural Decision Records (001–005)
│   └── PROJECT_STRUCTURE.md         # This specification
│
├── tests/                           # Monorepo End-to-End & Integration Tests
│   └── e2e-compiler.test.ts         # Full compilation & validation lifecycle verification
│
├── package.json                     # Root monorepo scripts
├── pnpm-workspace.yaml              # Workspace member definitions
├── README.md                        # Project overview & architectural guide
├── .gitignore                       # Git ignore rules
└── .env.example                     # Environment template
```

---

## 2. Dependency Isolation Boundaries

FlowOps is an entirely standalone, self-sufficient monorepo. It has **ZERO runtime, build, or deployment dependencies** on external temporary research repositories (`webclone` or `n8n`).

### Strict Boundary Rules:
1. **No External Imports**: No file inside `FlowOps/` may contain relative imports pointing outside its root (e.g. `../../webclone` or `../../n8n` are strictly prohibited).
2. **No Symlinks**: No symlinks may bridge between `FlowOps/` and sibling directories.
3. **No Workspace References to External Folders**: `pnpm-workspace.yaml` strictly matches `apps/*`, `packages/*`, and `infra/*` inside `FlowOps/`.
4. **Internal Workspace Protocol**: Internal package links use the `workspace:*` protocol:
   - `@flowops/contracts`
   - `@flowops/workflow-core`
   - `@flowops/workflow-compiler`
   - `@flowops/aws-adapter`

---

## 3. Package & Module Matrix

| Name | Role | Dependencies |
| :--- | :--- | :--- |
| `@flowops/contracts` | Domain types, schemas, interfaces | None |
| `@flowops/workflow-core` | DAG cycle detection & IR building | `@flowops/contracts` |
| `@flowops/workflow-compiler` | Pure ASL code generation | `@flowops/contracts`, `@flowops/workflow-core` |
| `@flowops/aws-adapter` | AWS SDK v3, Step Functions, DynamoDB, SSRF safety | `@flowops/contracts`, `@aws-sdk/*` |
| `@flowops/api` | Lambda task handlers & local dev server | `@flowops/contracts`, `@flowops/aws-adapter`, `@flowops/workflow-compiler` |
| `@flowops/web` | Next.js visual designer & console | `@flowops/contracts`, `@flowops/workflow-core`, `@flowops/workflow-compiler`, `@xyflow/react` |
| `@flowops/infra` | AWS CDK Infrastructure (ap-southeast-1) | `aws-cdk-lib`, `constructs` |

---

## 4. Local Development & Build Commands

```bash
# 1. Install all dependencies across the entire workspace
pnpm install

# 2. Build all packages, apps, and CDK infrastructure
pnpm build

# 3. Run all unit and integration test suites
pnpm test

# 4. Perform type checking across all packages
pnpm typecheck

# 5. Start Next.js Frontend Studio (http://localhost:3000)
pnpm dev:web

# 6. Start Local API Dev Server (http://localhost:4000)
pnpm dev:api

# 7. Synthesize AWS CloudFormation Templates
pnpm synth
```
