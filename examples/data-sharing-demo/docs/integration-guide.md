# Data Sharing Demo Integration Guide

> Audience: operators using this demo to understand the browser/backend split in a partner data-sharing integration.

## When to Use This

Use this demo when you want a concrete reference for:

- browser-side `@keyringnetwork/data-sharing-sdk` usage
- backend-side webhook handling
- mobile and extension verification branches
- simple session tracking across the whole demo

## Quick Start

1. Install dependencies from the repo root.
2. Copy `.env.example` in:
   - `apps/backend`
   - `apps/frontend`
3. Configure the Keyring URLs, webhook secret, and local app URLs.
4. Start both runtimes:

```bash
pnpm --filter data-sharing-backend dev
pnpm --filter data-sharing-frontend dev
```

## Required Configuration

- Backend:
  - `KEYRING_WEBHOOK_SECRET`
  - `KEYRING_API_KEY`
  - `KEYRING_API_URL`
  - `FRONTEND_URL`
- Frontend:
  - `NEXT_PUBLIC_BACKEND_URL`
  - `NEXT_PUBLIC_APP_API_URL`
  - any remaining frontend env values used by the current UI shell

## Responsibilities Split

| Frontend | Backend |
| --- | --- |
| create sessions | proxy partner metadata |
| request short-lived browser token from backend | mint short-lived client token from `KEYRING_API_KEY` |
| render QR / extension UI | receive and verify webhooks |
| subscribe to realtime session updates | store demo session records |
| display result state | expose backend session lookup endpoints |

## Common Mistakes

- Putting webhook secrets in the frontend
- Minting the client token in the browser instead of through the backend
- Running only the frontend and expecting webhook completion to work
- Treating the in-memory backend store as production persistence

## Deep Dives

- [Architecture](./architecture.md)
- [Technical Guide](./technical-guide.md)
