/**
 * FlowOps Notes & Canvas Annotation Contracts
 * Strictly decoupled from executable Step Functions AST and compiler graph.
 */

export type NoteCategory =
  | 'GENERAL'
  | 'TECHNICAL'
  | 'API'
  | 'DATA_MAPPING'
  | 'WARNING'
  | 'SECURITY'
  | 'TODO'
  | 'DECISION'
  | 'CHECKLIST'
  | 'AI_AUTOMATION';

export type NoteColorTheme =
  | 'stone'
  | 'blue'
  | 'green'
  | 'amber'
  | 'red'
  | 'purple'
  | 'cyan'
  | 'gray';

export interface WorkflowAnnotation {
  id: string;
  workflowId: string;
  title: string;
  category: NoteCategory;
  color: NoteColorTheme;
  content: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  zIndex: number;
  isCollapsed?: boolean;
  isPinned?: boolean;
  linkedNodeIds?: string[];
  tags?: string[];
  createdBy?: string;
  updatedAt: string;
}

export interface NoteTemplate {
  id: string;
  category: NoteCategory;
  defaultColor: NoteColorTheme;
  title: string;
  content: string;
  description: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'template-general-overview',
    category: 'GENERAL',
    defaultColor: 'stone',
    title: 'Workflow Overview',
    description: 'Document business context, ownership, and expected pipeline outcome.',
    content: `### Purpose
Describe the primary business objective of this workflow orchestration.

- **Primary Goal:** 
- **Trigger Source:** 
- **Expected Outcome:** 
- **Owner Team:** Engineering / Operations`,
  },
  {
    id: 'template-api-contract',
    category: 'API',
    defaultColor: 'cyan',
    title: 'API Integration Contract',
    description: 'Endpoint, HTTP verb, authentication, and payload schema.',
    content: `### Endpoint Details
- **Method & Path:** \`POST /v1/charges/verify\`
- **Auth Type:** Bearer Token (Secure Connection)
- **Headers:** \`Content-Type: application/json\`

### Expected Response
\`\`\`json
{
  "status": "APPROVED",
  "authCode": "AUTH-1092"
}
\`\`\``,
  },
  {
    id: 'template-security-warning',
    category: 'SECURITY',
    defaultColor: 'red',
    title: 'Security Considerations',
    description: 'Data protection, credential masking, and permission policies.',
    content: `> [!CAUTION]
> **Zero Plaintext Secrets Rule**
> Third-party API keys must NEVER be stored in workflow graph JSON.
> Reference them via encrypted connection secrets.

- **PII Handling:** Sanitize customer emails before dispatching to external webhooks.
- **SSRF Defense:** Internal IPs (\`127.0.0.1\`, \`169.254.169.254\`) are blocked.`,
  },
  {
    id: 'template-data-mapping',
    category: 'DATA_MAPPING',
    defaultColor: 'blue',
    title: 'Data Transformation Mapping',
    description: 'JSONPath mapping between node inputs and outputs.',
    content: `### JSONPath Mapping
- **Input Source:** \`$.order.payment_intent\`
- **Extracted Fields:**
  - \`$.amount\` &rarr; Amount in minor units (cents)
  - \`$.currency\` &rarr; ISO-4217 Currency code
- **Target Node:** Verify Payment API`,
  },
  {
    id: 'template-todo-checklist',
    category: 'TODO',
    defaultColor: 'amber',
    title: 'Implementation Checklist',
    description: 'Track outstanding deployment tasks and quality gates.',
    content: `- [x] Define Kahn DAG topology
- [ ] Connect Stripe production API credentials
- [ ] Configure 24h approval escalation timeout
- [ ] Verify Step Functions backoff retry behavior
- [ ] Run end-to-end integration test in LocalStack`,
  },
  {
    id: 'template-arch-decision',
    category: 'DECISION',
    defaultColor: 'purple',
    title: 'Architecture Decision (ADR)',
    description: 'Record architectural decision, context, and consequences.',
    content: `### Decision: Asynchronous Approval Gateway
- **Context:** High-value orders over $5,000 require manual signoff.
- **Decision:** Use AWS Step Functions \`.waitForTaskToken\` task state.
- **Consequence:** Workflow execution pauses for up to 24h without consuming Lambda runtime compute.`,
  },
  {
    id: 'template-failure-handling',
    category: 'WARNING',
    defaultColor: 'amber',
    title: 'Failure Recovery Strategy',
    description: 'Retry policy, fallback state, and alerting escalations.',
    content: `### Failure Recovery Matrix
- **Error Equals:** \`States.TaskFailed\`, \`Lambda.ServiceException\`
- **Max Retries:** 3 attempts with exponential backoff (2.0 rate).
- **Fallback Action:** Route to \`controlFailure\` node with sanitized error cause.`,
  },
];
