# AGENTS.md — Data Sharing Demo Backend

> Express backend for partner proxying, demo session storage, and signed webhook receipt.

## Quick Start

```bash
pnpm run dev
pnpm run build
pnpm start
```

## Key Paths

| Task | Read first |
| --- | --- |
| Server entry and middleware | `src/index.ts` |
| Partner proxy behavior | `src/routes/partner.ts` |
| Session tracking endpoints | `src/routes/sessions.ts` |
| Webhook receipt and verification | `src/routes/webhooks.ts` |
| Demo session persistence | `src/services/sessionStore.ts` |

## Implementation Rules

- Keep this backend focused on reference responsibilities: partner proxying, demo session storage, and webhook handling.
- Keep webhook and token responsibilities aligned with the public SDK docs.
- Preserve the distinction between demo persistence and production persistence.

## Pitfalls

- Do not imply the in-memory store is production-ready.
- Do not move browser-only concerns into backend docs.
