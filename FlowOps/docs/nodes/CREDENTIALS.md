# FlowOps Credential Architecture & Secret Management

FlowOps provides enterprise secret isolation to ensure API keys, OAuth tokens, and database passwords are never exposed in plaintext.

---

## 1. Storage & Encryption Model

All credentials managed within FlowOps are encrypted using **AES-256-GCM** with unique 96-bit initialization vectors (IV) before storage.

```
Plaintext Secret (e.g. Stripe API Key: sk_live_...)
                      │
                      ▼
   AES-256-GCM Encryption with Master Key + Random IV
                      │
                      ▼
       Stored DynamoDB Item:
       {
         "PK": "TENANT#t_acme",
         "SK": "CREDENTIAL#c_stripe",
         "encryptedData": "d5f8a0... (hex)",
         "iv": "3a8c1f... (hex)",
         "authTag": "e7b204... (hex)",
         "maskedDisplay": "sk_live_••••••••38f9"
       }
```

---

## 2. Masking & Redaction

When credentials are queried for UI display or workflow inspection:
- Only the `maskedDisplay` field is returned to the client browser.
- The decryption key is strictly retained within the backend execution boundary.
- Exported workflows, workflow templates, and public share links unconditionally scrub credential IDs and secret parameters.

---

## 3. Supported Credential Providers

1. **`HTTP_BEARER`**: Authorization Bearer tokens for REST APIs.
2. **`HTTP_BASIC`**: Username & password credentials with base64 header encoding.
3. **`API_KEY`**: Key/Value query parameter or header injection.
4. **`AWS_IAM_ROLE`**: IAM Role ARN assumed dynamically via AWS STS for cross-account service execution.
5. **`OAUTH2_CLIENT`**: Client ID and Client Secret with automatic token renewal and refresh token caching.
6. **`DATABASE_URL`**: Encrypted connection strings for PostgreSQL, MySQL, and Supabase.
