# Reimbursement Project Guide

Instructions for agents working in this repository. Follow the existing implementation and README files; do not assume that a dependency or service is available just because it is part of the architecture.

## Project structure

- `frontend/` — Next.js App Router, React, TypeScript, Tailwind CSS.
- `backend/` — Express REST API, TypeScript, Prisma.
- PostgreSQL — application database, accessed by the backend through Prisma.
- MinIO — object storage for profile photos, reimbursement/expense receipts, and payment proofs.
- Root `docker-compose.yml` — runs **MinIO only**. It does not run PostgreSQL, the frontend, or the backend.

### Frontend request flow

- `frontend/app/page.tsx` restores the browser session and connects dashboard callbacks.
- `frontend/app/components/` contains shared UI and role-specific dashboards.
- `frontend/app/actions/` contains browser requests to the backend API.
- `frontend/app/api/auth/[...all]/route.ts` proxies authentication requests to the backend.

### Backend request flow

- `backend/src/routes/` maps HTTP endpoints and middleware.
- `backend/src/controllers/` handles HTTP request/response behavior.
- `backend/src/services/` contains business logic and integrations such as object storage.
- `backend/src/models/` handles database access.
- `backend/src/views/` formats API response data.
- `backend/src/middleware/` contains authentication, authorization, and upload middleware.
- `backend/src/docs/openapi.ts` documents the REST API.
- `backend/prisma/schema.prisma` and `backend/prisma/migrations/` define the database schema and migrations.

## Development rules

- Before editing, inspect the relevant code, callers, and nearby tests. Trace a feature across the UI, API action, route, controller, service, and model as applicable.
- Keep frontend and backend request/response contracts consistent. Update the OpenAPI documentation when an API contract changes.
- Preserve the existing roles (`EMPLOYEE`, `MANAGER`, `FINANCE`), role permissions, reimbursement status transitions, validation rules, and user-visible loading/error/success states.
- Keep business rules in the existing backend service/controller layers; do not duplicate server-side authorization or validation only in the UI.
- Make the smallest complete change that fixes the requested behavior. Avoid unrelated refactors.
- For database changes, update `backend/prisma/schema.prisma` and add the appropriate migration. Never reset, wipe, or modify a user's database as a shortcut.
- For uploads, use the existing object-storage service and object-key conventions. Preserve MIME/content validation and file-size limits. Store object keys in the database, not expiring presigned URLs.
- Add or update tests for changed behavior where a suitable test setup exists. Do not claim an untested flow was verified.

## Environment and secrets

- Local environment files may contain secrets. Never print, quote, commit, or ask the user to share secret values. Inspect only the specific variable names and nonsecret values needed.
- `frontend/.env.local` is local frontend configuration and is ignored by Git. Next.js loads it for local development; restart the frontend dev server after changing it.
- `NEXT_PUBLIC_API_URL` is the browser-facing backend API URL. `BACKEND_API_URL` is used by the Next.js authentication proxy. `PORT` selects the frontend dev-server port.
- `backend/.env` contains backend configuration. `PORT` sets the API port; `CORS_ORIGIN` must include the actual browser origin (scheme, host, and port).
- `MINIO_ENDPOINT` must be a hostname/IP without scheme or path. Compose also uses it as the host IP for port binding; it must currently be assigned to the machine. `MINIO_PORT` and `MINIO_USE_SSL` configure the backend S3 client.
- Do not replace machine-specific API/MinIO addresses with assumed IPs. Check the effective frontend URL, browser origin, backend port, and current host address before changing configuration.

## Debugging

### Browser reports `Failed to fetch`

1. Check the exact request URL in the browser Network panel.
2. Verify the frontend is using the expected `NEXT_PUBLIC_API_URL` and that the backend process is listening at that address and port.
3. Verify the browser origin is included in backend `CORS_ORIGIN`; compare the full origin, including scheme and port.
4. Check the backend root endpoint and inspect the actual response. A `401` on a protected endpoint without a token shows the endpoint is reachable, but does not prove authentication or data loading succeeded.
5. Inspect browser console and backend logs for the specific failure before editing code.

### Profile or evidence upload hangs/fails

1. Trace the multipart form request through the upload route, middleware, controller, and object-storage service.
2. Check file type/size validation and the backend's nonsecret MinIO endpoint settings.
3. Check that the MinIO container is running and healthy, and that its bound IP/port matches the current configuration.
4. Distinguish API reachability from MinIO reachability. The API can run normally while an upload waits or fails because MinIO is unavailable.
5. Verify an end-to-end upload/read flow before reporting storage as fully working.

## Commands and validation

Check each app's `package.json` before using a script. The currently available scripts are:

```powershell
# Frontend development server
Set-Location D:\reimbursement\frontend
npm run dev

# Frontend production build
npm run build

# Backend development server
Set-Location D:\reimbursement\backend
npm run dev

# Backend tests and TypeScript build
npm test
npm run build
```

Backend tests currently cover local-upload migration utilities and object storage. The frontend package currently defines `dev`, `build`, and `start`; do not assume it has a test or lint script.

When MinIO is required and the user has authorized starting it, run from the repository root:

```powershell
Set-Location D:\reimbursement
docker compose --env-file backend\.env up -d minio
docker compose --env-file backend\.env ps
```

- Run the narrowest relevant validation for the change; run broader checks only when needed or requested.
- Do not start or stop dev servers, Docker containers, or databases unless the user has authorized it.
- Do not run migrations or data-changing scripts against a user's environment without explicit approval.
- Never delete local uploads, database contents, Docker volumes, or backups during routine development.
- A successful build or healthy MinIO container alone does not verify the whole application.
- In the final summary, state what changed, which checks actually ran, and any remaining manual steps or blocked verification.
