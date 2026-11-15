# FlowOps Node Registry & Architecture

The Node Registry (`packages/workflow-core/src/nodeRegistry.ts`) is the single source of truth for all node types, parameter schemas, execution categories, and availability constraints.

---

## 1. Node Schema Definition

Every node registered in FlowOps adheres to the `FlowNodeDefinition` contract:

```typescript
export interface FlowNodeDefinition {
  id: string;                                   // Unique node identifier
  type: string;                                 // Internal type key (e.g. 'actionHttp')
  displayName: string;                          // Human-readable display label
  category: NodeCategory;                       // 1 of 7 standard categories
  description: string;                          // Functional description
  icon: string;                                 // Lucide icon identifier
  availability: NodeAvailability;               // AVAILABLE | BETA | PLANNED | DISABLED
  availabilityNotice?: string;                  // User-facing explanation if not available
  parameters: NodeParameterSchema[];            // Dynamic input parameter definitions
  defaultSettings?: NodeExecutionSettings;      // ASL Retry, Timeout, Error Policy
  inputs: Array<{ name: string; type: string }>; // Inbound ports
  outputs: Array<{ name: string; type: string }>;// Outbound ports
  docsUrl?: string;                             // Contextual documentation link
}
```

---

## 2. Parameter Types

Parameters in `NodeParameterSchema` support dynamic form generation in the 5-tab Node Details View (NDV):
- `string`: Single-line text input.
- `number`: Numeric integer or float input with min/max bounds.
- `boolean`: Toggle switch.
- `options`: Dropdown select with predefined label/value pairs.
- `json`: Monospace JSON editor with real-time syntax linting.
- `expression`: Expression mapping field supporting `{{ $json.field }}` evaluation.
- `code`: Multiline code editor.
- `credential`: Secret credential selector pointing to encrypted vault items.

---

## 3. Availability State Guardrails

The FlowOps compiler enforces availability state checks at compile time:

| Availability State | Canvas Palette Status | Inspector Configuration | Publishing Behavior |
| :--- | :--- | :--- | :--- |
| **`AVAILABLE`** | Fully enabled | Full parameter editing | Permitted to publish and deploy |
| **`BETA`** | Enabled with "BETA" badge | Full parameter editing | Permitted with beta execution warning |
| **`PLANNED`** | Visible with "PLANNED" badge | Read-only with timeline notice | **Actively blocked with `UNAVAILABLE_NODE_ERROR`** |
| **`DISABLED`** | Grayed out with "DISABLED" badge | Read-only with security notice | **Actively blocked with `UNAVAILABLE_NODE_ERROR`** |

### Safe Code Isolation Principle
The node `transformSafeCode` is explicitly assigned `availability: 'DISABLED'`. Because arbitrary JavaScript evaluation within the Node.js runtime process represents an unacceptable security risk (sandbox escape, prototype pollution, memory exhaustion), it will remain disabled until a hardened microVM execution environment (Firecracker or gVisor) is deployed in Phase V6.
