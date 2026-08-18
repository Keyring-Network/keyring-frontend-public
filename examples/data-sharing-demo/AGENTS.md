# AGENTS.md — Data Sharing Demo

> Reference app for browser-side data-sharing UX plus backend webhook handling.

## Quick Start

```bash
pnpm --filter data-sharing-backend dev
pnpm --filter data-sharing-frontend dev
```

## Structure

```text
examples/data-sharing-demo/
├── apps/backend/   # Express backend for partner proxying and webhook handling
├── apps/frontend/  # Next.js frontend for session UX and realtime state
└── docs/           # Operator-facing docs for the combined demo
```

## Runtime Split

- `apps/frontend` owns session creation, flow selection, progress UI, and result display.
- `apps/backend` owns partner proxying, demo session persistence, and signed webhook receipt.

## Implementation Rules

- Keep browser/server responsibilities explicit in every doc.
- Keep env names and port defaults aligned with `.env.example` and package manifests.
- Treat this as a reference integration, not a production deployment template.

## Pitfalls

- Do not imply the frontend alone is enough for real webhook-backed integration.
- Do not document the in-memory session store as production persistence.
