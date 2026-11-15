# FlowOps — Product Vision & Strategic Platform Roadmap

## 1. Executive Summary

FlowOps is an enterprise-grade, AI-powered cloud workflow automation and orchestration platform designed to bridge the chasm between developer-centric cloud primitives and business workflow automation.

Unlike legacy automation tools that run on monolithic node pollers, and unlike raw infrastructure-as-code scripts that lack human-centered interaction, FlowOps unifies:
- **Gustra-Inspired UI**: Warm Obsidian/Warm Stone aesthetics, high-density HUD data layout, and sub-16ms responsive canvas interactions.
- **Node-Based Interaction**: Intuitive visual DAG composition inspired by best-of-breed automation paradigms without runtime lock-in.
- **AWS-Native Execution Core**: Compiling declarative canvas graphs directly into standard AWS Step Functions Amazon States Language (ASL), executed on AWS serverless infrastructure with DynamoDB single-table persistence and S3 artifact lineage.
- **Enterprise Multi-Tenancy & Governance**: Granular RBAC, individual free personal quotas, multi-organization team workspaces, and zero-leak public sharing.

---

## 2. Core Pillars

```
+---------------------------------------------------------------------------+
|                           FlowOps Platform Pillars                        |
+---------------------+---------------------+-------------------------------+
|  1. Visual Freedom  |  2. Cloud-Native    |  3. Zero Trust Security       |
|  - 67 Typed Nodes   |  - AWS Step Funcs   |  - AES-256-GCM Credentials    |
|  - 5-Tab Inspector  |  - DynamoDB / S3    |  - SSRF-Safe Egress           |
|  - Dynamic Schema   |  - Sub-10ms Compile |  - SHA-256 Public Share Hashes|
+---------------------+---------------------+-------------------------------+
|  4. Honest Pricing  |  5. AI Intelligence |  6. Team Collaboration        |
|  - Hard Quotas (2)  |  - Copilot Prompt   |  - Real-Time Presence TTL     |
|  - Team Starters    |  - Natural Synthesis|  - Granular Workspace Roles   |
|  - Provider Agnostic|  - Schema-Safe Code |  - Audit Trails               |
+---------------------+---------------------+-------------------------------+
```

### Pillar 1: Visual Freedom with Strict Graph Semantics
Workflows are modeled as directed acyclic graphs (DAGs). The visual editor supports 7 node categories with instant validation, Kahn cycle detection, and rich documentation tabs right in the canvas.

### Pillar 2: Cloud-Native Serverless Execution
Workflows do not execute in volatile node daemon memory loops. Every published workflow compiles into an immutable Amazon States Language (ASL) state machine definition, deployed to AWS Step Functions Standard or Express workflows. State tracking, retries, and failure routing are handled by managed AWS infrastructure.

### Pillar 3: Zero-Trust Security by Default
- Third-party API credentials are encrypted with AES-256-GCM before database insertion.
- Publicly shared workflows are stored by unguessable cryptographically secure tokens (`sh_pub_...`), looked up solely by SHA-256 hash.
- Sensitive environment variables and credentials are unconditionally stripped from shared graphs.
- Arbitrary code execution (`transformSafeCode`) is disabled until isolated microVM virtualization is provisioned.

---

## 3. Product Roadmap

| Phase | Milestone | Focus Areas | Status |
| :--- | :--- | :--- | :--- |
| **V1** | Foundation & Core Monorepo | Monorepo structure, contracts, compiler IR, Step Functions ASL generator | **Complete** |
| **V2** | Architectural Independence | Isolation from reference clones, independent UI identity, local tooling | **Complete** |
| **V3** | LocalStack Integration | Local AWS compatibility, LocalStack Step Functions, DynamoDB, S3 emulation | **Complete** |
| **V4** | Stabilization & Notes | Real-time presence, rich annotations immunity, sub-16ms React Flow optimizations | **Complete** |
| **V5** | Product SaaS Expansion | 67-node registry, 5-tab NDV, Multi-tenancy, Quotas, Admin portal, Marketing UI | **Complete** |
| **V6** | MicroVM Sandbox Execution | Firecracker / gVisor safe JavaScript/Python isolated code runner | Planned |
| **V7** | Bedrock AI Orchestrator | Live AWS Bedrock Converse stream integration for dynamic agentic loops | Planned |

---

## 4. Competitive Differentiation Matrix

| Dimension | FlowOps | Zapier / Make | n8n | Raw AWS Step Functions Console |
| :--- | :--- | :--- | :--- | :--- |
| **Runtime Architecture** | AWS Step Functions Native | Proprietary Worker Fleet | Node.js Process / Docker | Native AWS |
| **Visual Design** | Obsidian Warm Stone Enterprise | Consumer SaaS | Developer Web UI | Developer Utility UI |
| **Canvas Performance** | Sub-16ms (@xyflow/react) | Standard Web DOM | Vue Canvas | SVG Graph Viewer |
| **Multi-Tenancy** | Individual Free (2 WFs) + Org | Account Based | Instance Based | AWS IAM Account Based |
| **Code Safety** | Sandboxed / Disabled Guard | Node Sandbox | Node vm2 (vulnerable) | Lambda isolated |
| **Credential Storage** | AES-256-GCM + RBAC Redaction | Cloud Encrypted | PostgreSQL Encrypted | AWS Secrets Manager / KMS |
