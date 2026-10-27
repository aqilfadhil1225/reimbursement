import { proxyBackendRequest } from '@/lib/backend-proxy';

export const runtime = 'nodejs';

export const GET = proxyBackendRequest;
export const HEAD = proxyBackendRequest;
export const POST = proxyBackendRequest;
export const PATCH = proxyBackendRequest;
export const PUT = proxyBackendRequest;
export const DELETE = proxyBackendRequest;
