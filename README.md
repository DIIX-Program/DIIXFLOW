# FlowOps — AI-Powered Cloud Workflow Orchestration Platform

> **Design, automate, execute, and observe complex workflows through one intelligent cloud-native platform.**

FlowOps combines:
1. **Gustra Visual Design**: Enterprise dashboard density, warm stone canvas tones, hairline inset borders, and refined typography.
2. **n8n Workflow Interaction**: Visual drag-and-drop workflow canvas, typed node parameters, contextual drawers, and live execution tracing.
3. **AWS-Native Execution Engine**: Workflows compile to **Amazon States Language (ASL)** and execute natively on **AWS Step Functions Standard**, with serverless durability, automated exponential retries, and task-token human approvals.

---

## 1. Project Architecture & Repository Map

```
DIIXFLOW/
+-- docs/                               <-- Master Architecture & Reference Docs
|   +-- reference-analysis/
|   |   +-- GUSTRA_ANALYSIS.md          <-- Extracted Gustra visual tokens & metrics
|   |   +-- N8N_UX_ANALYSIS.md          <-- n8n interaction patterns & data model
|   |   +-- screenshots/gustra/         <-- High-res screenshots at 1440, 1280, 768, 390px
|   +-- DESIGN_SYSTEM.md                <-- Complete design tokens & component rules
|   +-- ARCHITECTURE.md                 <-- System architecture & logical diagrams
|   +-- DATABASE.md                     <-- DynamoDB single-table schema (flowops-main)
|   +-- API.md                          <-- REST API v2 endpoints & payload schemas
|   +-- COMPILER.md                     <-- DAG validation & ASL generator spec
|   +-- SECURITY.md                     <-- SSRF defense, RBAC & secrets management
|   +-- DEPLOYMENT.md                   <-- CDK deployment to ap-southeast-1
|   +-- COST_ESTIMATION.md              <-- FinOps cost model ($2.08/mo at 10k execs)
|   +-- TESTING.md                      <-- Vitest, RTL, and Playwright test matrix
|   +-- IMPLEMENTATION_PLAN.md          <-- Phased implementation roadmap
|   +-- ADR/                            <-- Architecture Decision Records
|       +-- 001-serverless-first.md
|       +-- 002-step-functions-standard.md
|       +-- 003-dynamodb-data-model.md
|       +-- 004-workflow-compiler-ir.md
|       +-- 005-state-machine-versioning.md
|
+-- packages/compiler/                  <-- Pure TypeScript Workflow Compiler
|   +-- src/
|       +-- types.ts                    <-- React Flow, IR, and ASL schemas
|       +-- validation.ts               <-- Kahn's Algorithm DAG cycle detection (O(V+E))
|       +-- ir.ts                       <-- Intermediate Representation builder
|       +-- asl.ts                      <-- Amazon States Language generator
|       +-- index.ts                    <-- Main compiler entrypoint
|       +-- __tests__/compiler.test.ts  <-- 100% passing test suite
|
+-- ai-website-cloner-template/         <-- FlowOps Modern Web Application
|   +-- src/app/
|   |   +-- page.tsx                    <-- Overview Operations Dashboard
|   |   +-- workflows/page.tsx          <-- Workflows Registry & Filter Desk
|   |   +-- workflows/[id]/editor/      <-- Flagship React Flow Visual Canvas
|   |   +-- executions/page.tsx         <-- Execution History & Filter Table
|   |   +-- executions/[id]/page.tsx    <-- Execution Trace & Node Payloads
|   |   +-- approvals/page.tsx          <-- Human-in-the-Loop Approval Queue
|   |   +-- connections/page.tsx        <-- API Connections & Masked Secrets
|   |   +-- templates/page.tsx          <-- Pre-engineered Enterprise Blueprints
|   |   +-- settings/page.tsx           <-- Workspace & AWS Region Settings
|   +-- src/components/
|       +-- layout/                     <-- Collapsible Sidebar (240px/76px) & Topbar
|       +-- workflow-editor/            <-- Node Explorer, Custom Nodes, NDV, Trace
|
+-- backend/                            <-- AWS Lambda Handlers & Tasks
|   +-- src/handlers/
|       +-- httpTaskExecutor.ts         <-- HTTP Task Runner with SSRF IP Guard
|       +-- approvalDispatcher.ts       <-- Step Functions .waitForTaskToken handler
|       +-- approvalCallback.ts         <-- SendTaskSuccess / SendTaskFailure handler
|
+-- infra/                              <-- AWS CDK Infrastructure (ap-southeast-1)
|   +-- lib/flowops-stack.ts            <-- DynamoDB, S3, Cognito, API Gateway, Lambdas
|   +-- bin/flowops-app.ts              <-- CDK App entry point
|
+-- n8n/                                <-- Read-Only Functional UX Reference
```

---

## 2. Key Capabilities & Differentiators

| Capability | FlowOps Implementation |
|---|---|
| **Visual Workflow Canvas** | `@xyflow/react` v12 with custom typed nodes, drag-and-drop palette, minimap, and instant node configuration drawer. |
| **Compiler & Validation** | Pure TypeScript compiler utilizing **Kahn's Algorithm** for $O(V+E)$ DAG cycle detection, single-entry verification, and reachability analysis. |
| **AWS Step Functions Engine** | Visual graphs compile directly to **Amazon States Language (ASL)**, deploying immutable versioned state machines on Step Functions Standard. |
| **Human-in-the-Loop** | Native Step Functions task token callback pattern (`.waitForTaskToken`) enabling executions to pause securely for hours or days. |
| **SSRF & Security Defense** | DNS-resolution verification blocking private IP blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`) and AWS metadata service (`169.254.169.254`). |
| **Zero-Idle-Cost FinOps** | 100% Serverless architecture (Lambda Graviton ARM64, DynamoDB On-Demand, S3, Cognito) running at **~$2.08/month** for 10,000 executions. |

---

## 3. Quickstart & Verification

### 3.1 Run Compiler Test Suite
```bash
# Build and run the 6-suite compiler test matrix
node ai-website-cloner-template/node_modules/typescript/bin/tsc -p packages/compiler/tsconfig.json
node --test packages/compiler/dist/__tests__/compiler.test.js
```

### 3.2 Run Frontend Web Application
```bash
cd ai-website-cloner-template
npm run build
npm run dev
# Open http://localhost:3000
```

# DIIXFLOW
