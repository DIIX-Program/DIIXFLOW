# FlowOps Public Sharing Security & Zero-Leak Architecture

Public workflow sharing allows users to share automation patterns while preventing accidental credential or sensitive environment leakage.

---

## 1. Unguessable Token Generation & Hashing

When a user enables public sharing on a workflow:
1. The backend generates a 256-bit cryptographically secure random token:
   ```typescript
   const rawToken = `sh_pub_${crypto.randomBytes(32).toString('hex')}`;
   ```
2. The platform computes a one-way SHA-256 hash of the token:
   ```typescript
   const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
   ```
3. The database record stores `tokenHash`, `workflowId`, `sanitizedGraph`, and `expiresAt`. **The raw token is NEVER stored in the database.**
4. When an external visitor requests `GET /api/v1/public/workflows/:token`, the server hashes the incoming token and performs a point-lookup on `tokenHash`. Even in the event of a database compromise, attacker dumps contain only one-way hashes from which the raw access URLs cannot be derived.

---

## 2. Dynamic Secret Redaction

Before any graph payload is returned to an unauthenticated public requester, it passes through the `sanitizeWorkflowGraph` pipeline:
- All fields designated `secret: true` in the node's schema are replaced with `"[REDACTED]"`.
- All credentials assigned to nodes are stripped (`credentialId: undefined`).
- Inbound webhook URLs and API keys are neutralized.
- Custom headers containing `Authorization`, `Bearer`, `X-Api-Key`, or `Cookie` are purged.

---

## 3. Revocation & Link Expiration

- **Immediate Revocation**: Disabling the public share toggle in the workflow editor instantly removes the hash entry from `PUBLIC_SHARES`. Any subsequent requests return `404 Share link expired or revoked`.
- **Rotatable Links**: Generating a new link replaces the previous token hash, immediately invalidating old URLs.
