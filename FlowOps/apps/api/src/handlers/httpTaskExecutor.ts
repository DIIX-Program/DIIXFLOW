import { executeSafeHttpRequest, HttpRequestOptions } from '@flowops/aws-adapter';

interface TaskEvent {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutSeconds?: number;
}

/**
 * AWS Lambda Handler for Step Functions Task State: ActionHttp
 * Runtime: Node.js 22.x (ARM64 Graviton)
 */
export async function handler(event: TaskEvent) {
  console.log('FlowOps HTTP Task Executor invoked:', {
    method: event.method,
    url: event.url,
  });

  const requestOptions: HttpRequestOptions = {
    method: event.method || 'GET',
    url: event.url,
    headers: event.headers,
    body: event.body,
    timeoutSeconds: event.timeoutSeconds || 30,
  };

  try {
    const result = await executeSafeHttpRequest(requestOptions);
    return {
      status: 'SUCCEEDED',
      statusCode: result.statusCode,
      headers: result.headers,
      body: result.body,
      durationMs: result.durationMs,
    };
  } catch (error: unknown) {
    console.error('FlowOps HTTP Task Executor error:', error);
    throw error;
  }
}
