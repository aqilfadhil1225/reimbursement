import { proxyBackendRequest } from '@/lib/backend-proxy';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return proxyBackendRequest(request);
}

export async function POST(request: Request) {
  return proxyBackendRequest(request);
}

export async function PATCH(request: Request) {
  return proxyBackendRequest(request);
}

export async function PUT(request: Request) {
  return proxyBackendRequest(request);
}

export async function DELETE(request: Request) {
  return proxyBackendRequest(request);
}
