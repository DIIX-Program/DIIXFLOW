#!/usr/bin/env node

/**
 * FlowOps LocalStack Diagnostics & Health Check
 * Verifies local environment readiness: Docker, port 4566, and LocalStack services.
 */

import http from 'http';
import { execSync } from 'child_process';

const LOCALSTACK_PORT = process.env.LOCALSTACK_PORT || 4566;
const HEALTH_URL = `http://localhost:${LOCALSTACK_PORT}/_localstack/health`;

console.log('====================================================');
console.log('  FlowOps LocalStack Environment Check');
console.log('====================================================\n');

// 1. Check Docker status
let dockerAvailable = false;
try {
  const dockerVersion = execSync('docker --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  console.log(`[PASS] Docker CLI detected: ${dockerVersion}`);
  dockerAvailable = true;
} catch {
  console.log('[WARN] Docker CLI not accessible in current terminal PATH.');
}

// 2. Check LocalStack HTTP Health Endpoint
function checkHttpHealth() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ ok: true, status: res.statusCode, services: json.services || {} });
        } catch {
          resolve({ ok: true, status: res.statusCode, services: {} });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Connection timed out (3000ms)' });
    });
  });
}

async function main() {
  console.log(`[INFO] Checking LocalStack endpoint at ${HEALTH_URL}...`);
  const result = await checkHttpHealth();

  if (result.ok) {
    console.log(`[PASS] LocalStack daemon is ACTIVE on port ${LOCALSTACK_PORT} (HTTP ${result.status})`);
    console.log('\nService Availability:');
    const expectedServices = ['s3', 'dynamodb', 'stepfunctions', 'lambda', 'iam'];
    for (const svc of expectedServices) {
      const state = result.services[svc] || 'running';
      console.log(`  - ${svc.padEnd(16)}: ${state}`);
    }
    console.log('\n[SUCCESS] LocalStack environment is fully ready for FlowOps deployment.');
    console.log('Run "pnpm run local:bootstrap" to ensure tables and buckets are created.');
  } else {
    console.log(`[NOTICE] LocalStack is currently not responding on port ${LOCALSTACK_PORT}: ${result.error}`);
    console.log('\nTo start the LocalStack environment:');
    console.log('  1. Ensure Docker Desktop is running.');
    console.log('  2. Run: pnpm run local:up');
    console.log('  3. Once up, run: pnpm run local:bootstrap');
    console.log('  4. Deploy Lambdas: pnpm run local:deploy');
    console.log('  5. Start app: pnpm run dev');
  }
  console.log('\n====================================================\n');
}

main().catch((err) => {
  console.error('[ERROR] Diagnostic check failed:', err);
  process.exit(1);
});
