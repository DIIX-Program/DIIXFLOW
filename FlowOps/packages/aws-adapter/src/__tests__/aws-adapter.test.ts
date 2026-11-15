import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isForbiddenIp } from '../httpExecutor.js';
import { CredentialService } from '../services/credential.service.js';
import { S3ArtifactService } from '../services/s3-artifact.service.js';
import { getEnvironmentConfig } from '../config/environment.js';

describe('FlowOps AWS Adapter Security & Utility Test Suite', () => {
  test('1. SSRF Protection: Correctly identifies forbidden internal/metadata IPs', () => {
    // AWS Metadata IP
    assert.strictEqual(isForbiddenIp('169.254.169.254'), true);
    // Link local
    assert.strictEqual(isForbiddenIp('169.254.1.1'), true);
    // Loopback IPv4
    assert.strictEqual(isForbiddenIp('127.0.0.1'), true);
    assert.strictEqual(isForbiddenIp('127.12.34.56'), true);
    // RFC 1918 Private
    assert.strictEqual(isForbiddenIp('10.0.0.1'), true);
    assert.strictEqual(isForbiddenIp('192.168.1.1'), true);
    assert.strictEqual(isForbiddenIp('172.16.0.1'), true);
    assert.strictEqual(isForbiddenIp('172.31.255.255'), true);
    // IPv6 Loopback
    assert.strictEqual(isForbiddenIp('::1'), true);
    // IPv6 Link-Local
    assert.strictEqual(isForbiddenIp('fe80::1'), true);
    // IPv6 Unique-Local
    assert.strictEqual(isForbiddenIp('fc00::1'), true);
    // IPv4-mapped IPv6
    assert.strictEqual(isForbiddenIp('::ffff:127.0.0.1'), true);
    assert.strictEqual(isForbiddenIp('::ffff:169.254.169.254'), true);

    // Legitimate Public IPs must NOT be forbidden
    assert.strictEqual(isForbiddenIp('8.8.8.8'), false);
    assert.strictEqual(isForbiddenIp('1.1.1.1'), false);
    assert.strictEqual(isForbiddenIp('93.184.216.34'), false); // example.com
  });

  test('2. Credential Service: AES-256-GCM encryption, decryption, and masking', () => {
    const service = new CredentialService('test-master-key-flowops-123456');
    const secret = 'sk_live_stripe_secret_key_abcdef123456';

    const encrypted = service.encryptSecret(secret);
    assert.notStrictEqual(encrypted.cipherText, secret);
    assert.ok(encrypted.iv);
    assert.ok(encrypted.tag);

    const decrypted = service.decryptSecret(encrypted.cipherText, encrypted.iv, encrypted.tag);
    assert.strictEqual(decrypted, secret);

    const masked = service.maskSecret(secret);
    assert.strictEqual(masked, '••••••••3456');
  });

  test('3. S3 Artifact Service: Generates compliant tenant-scoped object key paths', () => {
    const s3Service = new S3ArtifactService('flowops-artifacts-test');
    const prefix = s3Service.getArtifactKeyPrefix('tenant-1', 'wf-orders', 3);
    assert.strictEqual(prefix, 'tenants/tenant-1/workflows/wf-orders/versions/3');
  });

  test('4. Environment Config: Defaults to LocalStack mode without AWS credentials requirement', () => {
    process.env.EXECUTION_PROVIDER = 'localstack';
    const env = getEnvironmentConfig();
    assert.strictEqual(env.mode, 'localstack');
    assert.strictEqual(env.isLocal, true);
    assert.strictEqual(env.endpoint, 'http://localhost:4566');
    assert.strictEqual(env.credentials?.accessKeyId, 'test');
  });
});
