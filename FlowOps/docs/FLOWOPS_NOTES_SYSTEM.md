# FlowOps Notes — Canvas Annotation & Documentation System

FlowOps Notes is a built-in canvas documentation system designed for documenting, explaining, and collaborating on complex cloud workflow pipelines directly on the visual editor canvas.

---

## 1. Architectural Immunity Rule

> [!IMPORTANT]
> **Notes are NOT executable Step Functions states.**  
> Notes must never alter workflow topology, Kahn DAG validation, root trigger detection, reachability, edge routing, or Amazon States Language (ASL) code generation.

The compiler and validator automatically filter out annotation elements:
```ts
// Exclude non-executable annotations from compiler & topological checks
const executableNodes = graph.nodes.filter(
  (n) => n.type !== 'annotationNote' && !n.id.startsWith('note-')
);
const executableEdges = graph.edges.filter(
  (e) => !e.source.startsWith('note-') && !e.target.startsWith('note-')
);
```

### Compiler Immunity Verification Test
Automated test `TEST 5` in `tests/routing-api-notes.test.js` compiles a baseline workflow to ASL, then adds 5 annotations (Security Warning, API Contract, Checklist, Architecture Decision), and compiles again. The resulting ASL JSON strings are compared byte-for-byte:
$$\text{Digest}(\text{ASL}_{\text{baseline}}) \equiv \text{Digest}(\text{ASL}_{\text{annotated}})$$
**Result: 100% Bit-for-bit identical.**

---

## 2. Note Categories

FlowOps Notes supports 10 specialized categories:

| Category | Icon | Default Theme | Purpose |
| :--- | :--- | :--- | :--- |
| **GENERAL** | `FileText` | `stone` | Document business context, ownership, and expected outcomes. |
| **TECHNICAL** | `Code2` | `cyan` | Describe technical architecture, runtime considerations, and dependencies. |
| **API** | `Globe` | `cyan` | Specify HTTP endpoints, request headers, payload contracts, and status codes. |
| **DATA_MAPPING** | `GitBranch` | `blue` | Explain JSONPath extraction (`$.amount`) and field transformations. |
| **WARNING** | `AlertTriangle` | `amber` | Highlight failure points, flaky services, and recovery strategies. |
| **SECURITY** | `ShieldAlert` | `red` | Emphasize zero-plaintext secret rules and PII sanitization. |
| **TODO** | `CheckSquare` | `amber` | Track unfinished engineering tasks before publishing. |
| **DECISION** | `HelpCircle` | `purple` | Record Architecture Decision Records (ADRs) with context and trade-offs. |
| **CHECKLIST** | `CheckSquare` | `green` | Quality gates and pre-deployment checklists. |
| **AI_AUTOMATION** | `Sparkles` | `purple` | Document prompt constraints, model selections, and agent parameters. |

---

## 3. Cohesive Visual Design & Color Palette

Notes are rendered as premium editorial cards that adhere to the Gustra-inspired Warm Stone and Obsidian design direction:

- **Stone (`stone`)**: Neutral background with hairline stone borders (`#f0f0ee` light / `#1a1a19` dark).
- **Blue (`blue`)**: Sky blue border and translucent fill for data mapping.
- **Green (`green`)**: Emerald border and fill for quality gates and completed tasks.
- **Amber (`amber`)**: Amber border for warnings and pending items.
- **Red (`red`)**: Rose border for critical security warnings.
- **Purple (`purple`)**: Violet border for architecture decisions and AI models.
- **Cyan (`cyan`)**: Cyan border for technical specs and API contracts.
- **Gray (`gray`)**: Slate border for general notes.

---

## 4. Rich Content Features

### 4.1 Safe Markdown Rendering
Supports headings (`##`, `###`), bullet lists, blockquotes (`>`), inline code spans (`` `code` ``), bold text (`**bold**`), and sanitized links without allowing unsafe raw HTML injections.

### 4.2 Interactive Checklists
Checklist items (`- [ ] Task`) render with clickable checkboxes directly on the canvas. Clicking a checkbox toggles the item between `- [ ]` and `- [x]` without opening the editor modal, enabling real-time deployment tracking.

### 4.3 Node Resizer
Notes include React Flow `NodeResizer` handles on hover and selection, allowing users to resize cards freely on the canvas.

### 4.4 Collapse / Expand
A header chevron button collapses the note into a compact 40px summary bar, saving canvas real estate on dense workflows.

---

## 5. Built-in Templates (`NOTE_TEMPLATES`)

1. **Workflow Overview**: Purpose, trigger source, expected outcome, owner team.
2. **API Integration Contract**: Method, endpoint, auth type, headers, expected response.
3. **Security Considerations**: Zero plaintext secrets rule, PII masking, SSRF protections.
4. **Data Transformation Mapping**: JSONPath input, extracted fields, target node.
5. **Implementation Checklist**: Interactive tasks for testing and verification.
6. **Architecture Decision (ADR)**: Context, decision, consequences.
7. **Failure Recovery Strategy**: Error types, retry policies, escalation fallback.

---

## 6. How to Add & Manage Notes

### Method 1: Toolbar Button
Click the **"Notes"** button in the top toolbar to open the **FlowOps Notes Library**, preview templates, and insert into the canvas with one click.

### Method 2: Right-Click Canvas Menu
Right-click anywhere on the canvas background to open the Blur Glide context menu:
- `Add Workflow Note` &rarr; Select `General`, `Security`, `API`, or `Checklist`.

### Method 3: Context Menu on Note
Right-click on an existing note to:
- Edit content.
- Duplicate note.
- Delete note.
