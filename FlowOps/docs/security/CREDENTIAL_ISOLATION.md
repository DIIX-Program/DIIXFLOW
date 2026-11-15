# FlowOps Credential Isolation & Encryption Standard

Credential isolation is a fundamental security requirement of the FlowOps execution runtime.

---

## 1. Cryptographic Standards

- **Cipher Algorithm**: AES-256 in Galois/Counter Mode (`AES-256-GCM`).
- **Key Derivation**: 256-bit keys derived via PBKDF2 or loaded directly from AWS KMS (`FLOWOPS_MASTER_ENCRYPTION_KEY`).
- **IV / Nonce**: 96-bit cryptographically secure random Initialization Vector generated per encryption operation.
- **Authentication Tag**: 128-bit authentication tag validating ciphertext integrity and preventing chosen-ciphertext tampering.

---

## 2. Runtime Decryption Boundary

Plaintext credentials exist only within the short-lived memory scope of the execution adapter during outbound HTTP requests or AWS SDK task invocation:
1. The Step Functions runner or API worker requests the credential by ID and tenant ID.
2. The `CredentialService` validates that the requesting workflow belongs to the same tenant or project scope.
3. Decryption occurs in-memory.
4. The credential is used to sign the HTTP header or AWS request.
5. The decrypted variable goes out of scope and is eligible for garbage collection.
6. Execution history logs recorded in DynamoDB and S3 strictly omit raw authorization headers.

---

## 3. SSRF Protection on Outbound Requests

All outbound requests triggered by `actionHttp` or custom webhooks pass through an SSRF (Server-Side Request Forgery) guard:
- Resolves DNS hostname to IPv4/IPv6 address.
- Blocks connection if IP falls within private or loopback ranges:
  - `127.0.0.0/8` (Localhost)
  - `10.0.0.0/8` (Private Class A)
  - `172.16.0.0/12` (Private Class B)
  - `192.168.0.0/16` (Private Class C)
  - `169.254.169.254` (AWS EC2 / IMDSv1 / IMDSv2 Metadata)
  - `::1` (IPv6 Loopback)
  - `fc00::/7` (IPv6 Unique Local)
