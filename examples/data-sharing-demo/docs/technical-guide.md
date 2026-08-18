# Data Sharing Demo Technical Guide

> Maintainer-facing notes for changing the combined browser/backend reference app.

## Code Layout

| Path | Purpose |
| --- | --- |
| `apps/backend/src/index.ts` | backend entrypoint and middleware wiring |
| `apps/backend/src/routes/` | partner, session, and webhook endpoints |
| `apps/backend/src/services/sessionStore.ts` | demo-only session persistence |
| `apps/frontend/src/hooks/useDataSharing.ts` | browser-side flow orchestration |
| `apps/frontend/src/app/(home)/components/` | UI for idle, progress, mobile, extension, and result states |

## Important Types / Contracts

- Backend routes define the demo-facing API contract for partner info and session lookups.
- Frontend hooks and components define the demo UX around the headless SDK.
- The signed webhook contract is received and verified on the backend, not in the browser.

## Build and Test

```bash
pnpm --filter data-sharing-backend build
pnpm --filter data-sharing-frontend build
```

## Debugging / Maintenance Notes

- The backend session store is demo-only and should stay documented that way.
- Frontend and backend docs must stay aligned on token, session, and webhook responsibilities.
- When the SDK auth/session model changes, update this demo before changing screenshots or operator instructions.
