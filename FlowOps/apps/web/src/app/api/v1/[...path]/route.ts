import { NextRequest, NextResponse } from 'next/server';

const API_INTERNAL_BASE_URL = process.env.API_INTERNAL_BASE_URL || 'http://127.0.0.1:4000';

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathString = Array.isArray(path) ? path.join('/') : path || '';
  const search = request.nextUrl.search || '';
  const targetUrl = `${API_INTERNAL_BASE_URL}/api/v1/${pathString}${search}`;

  const forwardHeaders: Record<string, string> = {
    'x-forwarded-host': request.headers.get('host') || 'localhost:3000',
    'x-forwarded-proto': request.nextUrl.protocol.replace(':', ''),
  };

  const contentType = request.headers.get('content-type');
  if (contentType) forwardHeaders['content-type'] = contentType;

  const auth = request.headers.get('authorization');
  if (auth) forwardHeaders['authorization'] = auth;

  const workspaceId = request.headers.get('x-workspace-id');
  if (workspaceId) forwardHeaders['x-workspace-id'] = workspaceId;

  const idempKey = request.headers.get('idempotency-key');
  if (idempKey) forwardHeaders['idempotency-key'] = idempKey;

  const method = request.method;
  let body: BodyInit | undefined = undefined;

  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const text = await request.text();
      if (text) body = text;
    } catch {}
  }

  try {
    const apiRes = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      signal: AbortSignal.timeout(12000),
    });

    const data = await apiRes.text();
    const responseHeaders = new Headers();
    responseHeaders.set('content-type', apiRes.headers.get('content-type') || 'application/json');

    return new NextResponse(data, {
      status: apiRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    const isTimeout = err.name === 'TimeoutError' || err.code === 'ABORT_ERR';
    return NextResponse.json(
      {
        success: false,
        error: isTimeout ? 'GATEWAY_TIMEOUT' : 'BACKEND_UNAVAILABLE',
        message: isTimeout
          ? 'Internal FlowOps API timed out after 12000ms.'
          : 'FlowOps Backend API server is not running or unreachable on port 4000. Start backend with `pnpm run dev:all`.',
      },
      { status: isTimeout ? 504 : 503 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
export const HEAD = proxyRequest;
