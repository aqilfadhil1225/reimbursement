const BACKEND_AUTH_URL = `${process.env.BACKEND_API_URL ?? 'http://localhost:3001/api'}/auth`;

async function proxyAuthRequest(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/^\/api\/auth/, '');
  const targetUrl = new URL(`${BACKEND_AUTH_URL}${pathname || '/'}`);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!['host', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  const responseText = await response.text();

  return new Response(responseText, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  });
}

export async function GET(request: Request) {
  return proxyAuthRequest(request);
}

export async function POST(request: Request) {
  return proxyAuthRequest(request);
}

export async function PATCH(request: Request) {
  return proxyAuthRequest(request);
}

export async function PUT(request: Request) {
  return proxyAuthRequest(request);
}

export async function DELETE(request: Request) {
  return proxyAuthRequest(request);
}
