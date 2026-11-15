# FlowOps Testing Strategy & Test Plan

## 1. Testing Philosophy & Test Pyramid

FlowOps implements a multi-layer verification strategy to ensure high reliability across visual editing, graph compilation, backend persistence, and cloud execution:

```
           / \
          /   \     E2E Lifecycle Tests (Playwright)
         /     \    - End-to-end user workflow: Create -> Configure -> Publish -> Execute -> Trace
        /-------\
       /         \    AWS Integration Tests (Mocks & CDK Assertions)
      /           \   - DynamoDB access patterns, Step Functions mock execution, CDK template assertions
     /-------------\
    /               \   Compiler Test Suite (Vitest)
   /                 \  - DAG cycle detection, ASL generation, edge validation, IR generation
  /-------------------\
 /                     \  Frontend Component & Unit Tests (Vitest + React Testing Library)
/                       \ - Sidebar navigation, Node cards, Form schemas, Canvas state
-------------------------
```

---

## 2. Compiler Test Matrix

The `@flowops/compiler` suite tests all topological and syntactical edge cases:

| Test Case | Description | Expected Outcome |
|---|---|---|
| `VALID_SEQUENTIAL` | Trigger -> HTTP -> Wait -> Success | Passes validation, outputs valid ASL with sequential `Next` pointers |
| `VALID_BRANCHING` | Trigger -> Condition -> True Branch / False Branch | Passes validation, outputs ASL `Choice` state with default |
| `CYCLE_DETECTION` | A -> B -> C -> A | Fails with `GRAPH_CONTAINS_CYCLE` via Kahn's algorithm |
| `MULTIPLE_TRIGGERS` | Two trigger nodes in single graph | Fails with `MULTIPLE_ROOT_TRIGGERS` |
| `ORPHAN_ISLAND` | Disconnected node with no edges | Fails with `UNREACHABLE_NODES` |
| `MISSING_TERMINAL` | Action node without outgoing edge or terminal state | Fails with `DANGLING_NON_TERMINAL_NODE` |
| `INVALID_NODE_CONFIG` | HTTP request node missing required URL | Fails with Zod schema validation error specifying field |
| `APPROVAL_TOKEN_ASL` | Approval node in graph | ASL generates `.waitForTaskToken` callback with timeout |

---

## 3. End-to-End Scenario Verification (Milestone 4 & 5)

Full lifecycle test executed via automated script:
1. User logs in with Cognito mock / session.
2. User navigates to `/workflows` and creates a workflow.
3. Canvas loads with `Manual Trigger`.
4. User adds `HTTP Request` node from explorer and configures `POST https://httpbin.org/post`.
5. User adds `Condition` node checking `$.statusCode == 200`.
6. User connects branches to `Approval` gate and `Failure` state.
7. User runs graph validation -> Green checkmark.
8. User clicks **Publish** -> ASL compiles and version `v1` is created.
9. User clicks **Run Workflow** -> Step Functions execution starts.
10. Live execution panel tracks node transitions.
11. User inspects individual node input/output payloads.

---

## 4. Running the Test Suite

```bash
# Run all unit tests
npm test

# Run compiler tests with coverage
npm run test:compiler

# Run CDK infrastructure assertion tests
npm run test:cdk

# Run E2E test suite in headless mode
npm run test:e2e
```
