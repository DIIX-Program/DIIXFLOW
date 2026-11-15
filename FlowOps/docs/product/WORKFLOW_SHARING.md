# FlowOps Workflow Sharing & Granular Permissions Model

FlowOps provides enterprise workflow collaboration with zero compromise on credential security.

---

## 1. Sharing Modes

FlowOps workflows can exist in one of three visibility modes:

```
[ Private by Default ]  ──(Share via Link)──>  [ Public Shared Link ]
          │                                              │
(Share with Team Email)                           Unguessable Token
          │                                       SHA-256 Hash Lookup
          ▼                                       Sanitized DAG
   [ Organization / Team ]                        Zero Credentials
   Role: VIEWER / RUNNER / EDITOR
```

### 1.1 Mode 1: Private (`PRIVATE`)
- The default state for all newly created workflows.
- Accessible exclusively by the workflow creator and workspace members with matching permissions.
- Denies all unauthenticated and non-member requests.

### 1.2 Mode 2: Public Share via Unguessable Token (`PUBLIC`)
- Intended for open-source workflow templates, customer community showcases, and external sharing.
- **Token Format**: `sh_pub_` followed by 32 cryptographically secure random hexadecimal bytes (`sh_pub_7a1b9c4...`).
- **Zero Token Storage**: The raw token is NEVER stored in the database. FlowOps computes the SHA-256 hash of the token (`crypto.createHash('sha256').update(token).digest('hex')`) and indexes by the hash.
- **Automatic Sanitization**:
  - All node parameters marked `secret: true` (API keys, passwords, bearer tokens) are replaced with `[REDACTED]`.
  - Sensitive webhooks, database connection strings, and AWS account IDs are scrubbed.
  - Viewers can visually inspect the graph topology, parameters, and documentation.
  - Viewers can execute **"Fork to My Workspace"** to create a clone in their own workspace where they input their own credentials.
- **Revocation**: The workflow owner can toggle sharing OFF at any time, immediately invalidating the token.

### 1.3 Mode 3: Direct Email Invitation (`ORGANIZATION` / `TEAM`)
- Grant explicit privileges to team members or external partners by email address.
- Supported Workflow Share Roles:
  - **`VIEWER`**: Can view workflow canvas, inspect node parameters, view execution history. Cannot trigger or modify.
  - **`RUNNER`**: Inherits Viewer privileges + can trigger manual runs and supply runtime execution input payloads.
  - **`EDITOR`**: Inherits Runner privileges + can add nodes, modify schemas, configure Step Functions settings, and publish new versions.
  - **`OWNER`**: Complete administrative control, including transfer of ownership, deletion, and public sharing permissions.

---

## 2. API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workflows/:id/shares` | Generate or toggle public share link | Yes (Editor / Owner) |
| `DELETE` | `/api/v1/workflows/:id/shares/:shareId` | Revoke a public share link | Yes (Editor / Owner) |
| `GET` | `/api/v1/public/workflows/:token` | Fetch sanitized public workflow DAG | No (Public by token) |
| `GET` | `/api/v1/workflows/:id/access` | List explicit email share grants | Yes (Member) |
| `POST` | `/api/v1/workflows/:id/invitations` | Add email share invitation with role | Yes (Owner) |
| `DELETE` | `/api/v1/workflows/:id/invitations/:inviteId` | Revoke email share invitation | Yes (Owner) |
