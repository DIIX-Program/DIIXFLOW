# ADR 004: Workflow Compiler Intermediate Representation (IR)

## Context
Compiling UI-specific canvas state directly into cloud execution definitions creates tight coupling between the frontend framework (`@xyflow/react`) and the cloud target (Amazon States Language). This prevents easy testing, limits validation capabilities, and makes supporting alternative runtime targets or visual refactors difficult.

## Decision
We introduce an explicit, normalized **Intermediate Representation (IR)** stage in the workflow compilation pipeline:
```
React Flow Graph -> Schema & Graph Validation -> Intermediate Representation (IR) -> ASL Generator
```
The IR represents workflows as a canonical Directed Acyclic Graph (DAG) with normalized node types, typed input/output bindings, retry policies, and branching rules, decoupled from coordinate positions or UI visual artifacts.

## Consequences
- **Positive**:
  - The IR can be tested thoroughly without any React or AWS dependencies.
  - Topological sorting and cycle detection operate on clean graph primitives.
  - Future support for alternative backends (e.g. Temporal, Airflow) can reuse the same IR.
- **Negative / Mitigations**:
  - Requires maintaining IR mapping logic. This is encapsulated within `@flowops/compiler`.
