# FlowOps — Routing & Navigation Architecture

This document details the Next.js App Router tree in `@flowops/web`, explaining the resolution of the `/workflows/new` 404 error, dynamic route handling, and breadcrumb navigation.

---

## 1. Route Tree Overview

```
apps/web/src/app/
├── (overview)
│   └── page.tsx                   # Dashboard overview (/)
│
├── workflows/
│   ├── page.tsx                   # Workflows registry & search (/workflows)
│   ├── new/
│   │   └── page.tsx               # Dedicated workflow creation wizard (/workflows/new)
│   └── [id]/
│       └── editor/
│           └── page.tsx           # Full-screen Visual Workflow Studio (/workflows/:id/editor)
│
├── executions/
│   ├── page.tsx                   # Execution run history (/executions)
│   └── [id]/
│       └── page.tsx               # Execution inspection & trace drawer (/executions/:id)
│
├── approvals/
│   └── page.tsx                   # Human-in-the-Loop decision inbox (/approvals)
│
├── connections/
│   └── page.tsx                   # Secrets & API connection manager (/connections)
│
├── templates/
│   └── page.tsx                   # Pre-built orchestration templates (/templates)
│
├── settings/
│   └── page.tsx                   # Workspace settings & cloud providers (/settings)
│
└── api/
    └── v1/
        └── [...path]/
            └── route.ts           # Same-origin BFF proxy (/api/v1/*)
```

---

## 2. Resolution of ERROR A: `GET /workflows/new 404`

### The Problem
Previously, the `workflows/` directory only contained `[id]/editor/page.tsx` and `page.tsx`. When a user navigated to `/workflows/new`:
1. Next.js attempted to match static routes under `workflows/`.
2. Finding no `workflows/new/page.tsx`, it evaluated `workflows/[id]/...`.
3. Because `[id]` only had the subpath `editor/page.tsx`, the URL `/workflows/new` had no matching page component, yielding a **404 Not Found** response.

### The Solution
1. **Dedicated Static Route Created:**
   `apps/web/src/app/workflows/new/page.tsx` was created. In Next.js App Router, static segments (`/new`) always take priority over dynamic segments (`/[id]`), completely avoiding route collisions.
2. **Real Backend Draft Creation:**
   The page features a focused creation form (Name, Description, Primary Trigger). On submit, it calls:
   ```ts
   const created = await apiClient.createWorkflow({
     name: name.trim(),
     description: description.trim(),
     triggerType: 'MANUAL',
   });
   router.push(`/workflows/${created.id}/editor`);
   ```
3. **No Hardcoded Mock IDs:**
   The backend assigns a real, collision-free identifier (`wf_<timestamp>_<random>`), records the draft in DynamoDB, and uploads the initial starter graph to S3.
4. **Resilient Error Handling:**
   If the backend is offline, the form displays a clear error alert with troubleshooting instructions, rather than silently creating an in-memory orphan.

---

## 3. Workflow Studio Route: `/workflows/:id/editor`

When loading `/workflows/:id/editor`:
1. The route extracts `params.id`.
2. It queries `apiClient.getWorkflow(id)` to load the real workflow name and version.
3. If the workflow was just created, it loads the starter graph (Manual Trigger &rarr; Workflow Completed).
4. If an existing published workflow is opened, it loads the saved graph state.
