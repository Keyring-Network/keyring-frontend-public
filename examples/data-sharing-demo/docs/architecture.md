# Data Sharing Demo Architecture

> Scope: the reference browser-plus-backend app for `@keyringnetwork/data-sharing-sdk`.

## System Context

This demo mirrors the split a real partner integration needs: the browser owns session UX, while the backend owns partner credentials, webhook verification, and server-side persistence concerns.

## System At A Glance

| Runtime | Owns | Key paths |
| --- | --- | --- |
| Frontend | session creation, flow selection, realtime progress, result display | `apps/frontend/src/hooks/useDataSharing.ts`, `apps/frontend/src/app/(home)/components/` |
| Backend | partner info proxying, demo session tracking, signed webhook receipt | `apps/backend/src/routes/partner.ts`, `apps/backend/src/routes/sessions.ts`, `apps/backend/src/routes/webhooks.ts` |

## Flow Variants

- Mobile flow: frontend renders a QR-based handoff and watches session progress.
- Extension flow: frontend launches the extension path and watches session progress.
- Backend flow: backend receives the signed webhook and stores demo-facing session state.

## Key Boundaries

- Frontend owns UI and transient session UX.
- Backend owns secrets, webhook verification, and demo persistence.
- The SDK stays headless; the demo supplies all presentation.

## Implementation Pointers

- Start in `apps/frontend/src/hooks/useDataSharing.ts` for the browser-side orchestration.
- Start in `apps/backend/src/routes/` for server behavior.
