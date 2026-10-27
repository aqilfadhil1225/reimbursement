import { Buffer } from 'buffer';

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:3001/api';

export async function proxyBackendRequest(request: Request) {
  const requestUrl = new URL(request.url);
  const apiPath = requestUrl.pathname.replace(/^\/api(?=\/|$)/, '');
  const backendUrl = new URL(BACKEND_API_URL);
  backendUrl.pathname = `${backendUrl.pathname.replace(/\/+$/, '')}${apiPath}`;
  backendUrl.search = requestUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!['host', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body = ['GET', 'HEAD'].includes(request.method)
    ? undefined
    : Buffer.from(await request.arrayBuffer());

  const upstreamResponse = await fetch(backendUrl, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  });

  const responseHeaders = new Headers({
    'cache-control': 'no-store',
  });
  upstreamResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      responseHeaders.set(key, value);
    }
  });
  upstreamResponse.headers.getSetCookie().forEach((cookie) => {
    responseHeaders.append('set-cookie', cookie);
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}
