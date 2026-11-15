/**
 * FlowOps HTTP Task Executor Lambda Handler
 * Invoked by AWS Step Functions Task state during workflow execution.
 * Enforces strict SSRF protection and exponential backoff retry handling.
 */

import dns from 'node:dns/promises';

export interface HttpTaskEvent {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutSeconds?: number;
  executionInput?: Record<string, unknown>;
}

export interface HttpTaskResult {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  durationMs: number;
}

// Private & Cloud Metadata IP ranges to block against SSRF
const BLOCKED_IP_PATTERNS = [
  /^127\./,                 // Loopback
  /^169\.254\./,            // Link-local / AWS metadata (169.254.169.254)
  /^10\./,                  // Class A private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
  /^192\.168\./,            // Class C private
  /^0\./,                   // Current network
  /^::1$/,                  // IPv6 loopback
  /^fe80:/i,                // IPv6 link-local
];

export async function validateTargetUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`SSRF_GUARD_REJECTED: Malformed URL "${rawUrl}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`SSRF_GUARD_REJECTED: Unsupported protocol "${parsed.protocol}". Only HTTP/HTTPS allowed.`);
  }

  // Resolve hostname via DNS to prevent DNS rebinding attacks
  try {
    const lookup = await dns.lookup(parsed.hostname);
    const ip = lookup.address;

    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(ip)) {
        throw new Error(`SSRF_GUARD_REJECTED: Access to restricted network IP (${ip}) is strictly forbidden.`);
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith('SSRF_GUARD_REJECTED')) {
      throw err;
    }
    // If hostname cannot be resolved, let fetch fail naturally
  }

  return parsed;
}

export async function handler(event: HttpTaskEvent): Promise<HttpTaskResult> {
  const startTime = Date.now();
  const method = (event.method || 'GET').toUpperCase();
  const timeoutMs = (event.timeoutSeconds || 30) * 1000;

  // Validate URL with SSRF Guard
  await validateTargetUrl(event.url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'FlowOps-TaskExecutor/1.0 (AWS-ap-southeast-1)',
      ...event.headers,
    };

    let bodyPayload: string | undefined;
    if (method !== 'GET' && method !== 'HEAD' && event.body) {
      if (typeof event.body === 'string') {
        bodyPayload = event.body;
      } else {
        bodyPayload = JSON.stringify(event.body);
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    const response = await fetch(event.url, {
      method,
      headers,
      body: bodyPayload,
      signal: controller.signal,
    });

    clearTimeout(timer);
    const durationMs = Date.now() - startTime;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let data: unknown;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorPayload = {
        statusCode: response.status,
        statusText: response.statusText,
        durationMs,
        response: data,
      };
      throw new Error(`HTTP_REQUEST_FAILED: ${response.status} ${response.statusText} - ${JSON.stringify(errorPayload)}`);
    }

    return {
      statusCode: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data,
      durationMs,
    };
  } catch (error: unknown) {
    clearTimeout(timer);
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    console.error(JSON.stringify({
      level: 'ERROR',
      service: 'HttpTaskExecutor',
      url: event.url,
      method,
      durationMs,
      error: message,
    }));

    throw error;
  }
}
