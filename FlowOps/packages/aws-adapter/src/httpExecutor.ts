import dns from 'node:dns/promises';
import { isIP } from 'node:net';

export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutSeconds?: number;
  maxResponseBytes?: number;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
}

/**
 * Validates destination host IP against private, loopback, link-local, and cloud metadata CIDR ranges.
 * Critical defense against Server-Side Request Forgery (SSRF).
 */
export async function assertSafeDestination(urlString: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error(`SSRF_BLOCKED: Invalid URL format`);
  }

  // 1. Prohibit non-HTTP protocols (e.g. file://, gopher://, ftp://, dict://)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`SSRF_BLOCKED: Unsupported protocol ${parsed.protocol}`);
  }

  const hostname = parsed.hostname;

  // 2. Resolve DNS to target IPv4 and IPv6 addresses
  let ips: string[] = [];
  if (isIP(hostname)) {
    ips = [hostname];
  } else {
    try {
      const v4Records = await dns.resolve4(hostname).catch(() => [] as string[]);
      const v6Records = await dns.resolve6(hostname).catch(() => [] as string[]);
      ips = [...v4Records, ...v6Records];
      if (ips.length === 0) {
        throw new Error(`SSRF_BLOCKED: Unable to resolve hostname: ${hostname}`);
      }
    } catch {
      throw new Error(`SSRF_BLOCKED: DNS resolution failed for hostname: ${hostname}`);
    }
  }

  // 3. Evaluate each resolved IP address against restricted subnets
  for (const ip of ips) {
    if (isForbiddenIp(ip)) {
      throw new Error(`SSRF_BLOCKED: Access to internal/metadata IP prohibited (${ip})`);
    }
  }
}

export function isForbiddenIp(ip: string): boolean {
  // Normalize IPv4-mapped IPv6 (e.g., ::ffff:127.0.0.1 -> 127.0.0.1)
  const normalized = ip.toLowerCase().startsWith('::ffff:') ? ip.slice(7) : ip.toLowerCase();

  // IPv6 Checks
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true; // IPv6 loopback
  if (normalized.startsWith('fe80:')) return true; // IPv6 link-local
  if (normalized.startsWith('fc00:') || normalized.startsWith('fd00:')) return true; // IPv6 unique-local (ULA)
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true; // Unspecified

  // IPv4 Checks
  if (normalized.startsWith('127.')) return true; // IPv4 Loopback (127.0.0.0/8)
  if (normalized.startsWith('169.254.')) return true; // AWS Metadata (169.254.169.254) & Link-Local (169.254.0.0/16)
  if (normalized.startsWith('10.')) return true; // RFC 1918 Private 10.0.0.0/8
  if (normalized.startsWith('192.168.')) return true; // RFC 1918 Private 192.168.0.0/16
  if (normalized === '0.0.0.0') return true; // Zero address

  // RFC 1918 Private 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
  const parts = normalized.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }

  // CGNAT (100.64.0.0/10: 100.64.0.0 to 100.127.255.255)
  if (parts.length === 4 && parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) {
    return true;
  }

  return false;
}

/**
 * Safe, SSRF-resistant HTTP executor for Step Functions Task state executions.
 */
export async function executeSafeHttpRequest(
  options: HttpRequestOptions
): Promise<HttpResponse> {
  const startTime = Date.now();

  // 1. Enforce Pre-Flight SSRF Inspection
  await assertSafeDestination(options.url);

  const timeoutMs = (options.timeoutSeconds || 30) * 1000;
  const maxBytes = options.maxResponseBytes || 5 * 1024 * 1024; // 5 MB limit
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Note: redirect: 'manual' blocks attackers from using open HTTP 301/302 redirects to bypass IP checks
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers || {},
      body:
        options.method !== 'GET' && options.method !== 'DELETE'
          ? options.body
          : undefined,
      signal: controller.signal,
      redirect: 'manual',
    });

    clearTimeout(timeoutId);

    // If response is a redirect, forbid auto-following to prevent SSRF bypass
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      throw new Error(`SSRF_REDIRECT_PREVENTED: Automatic redirects disabled. Target attempted redirect to: ${location}`);
    }

    const durationMs = Date.now() - startTime;
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    // Enforce max response size limit
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      throw new Error(`PAYLOAD_TOO_LARGE: Response size ${arrayBuffer.byteLength} bytes exceeded limit of ${maxBytes} bytes`);
    }

    const textContent = new TextDecoder().decode(arrayBuffer);
    let bodyData: unknown = textContent;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        bodyData = JSON.parse(textContent);
      } catch {}
    }

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: bodyData,
      durationMs,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    throw {
      error: (error as Error).name || 'HttpExecutionFailed',
      cause: (error as Error).message,
      durationMs,
    };
  }
}
