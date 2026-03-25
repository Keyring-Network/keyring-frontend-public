# AGENTS.md — xLend Demo

> Reference app for `@keyringnetwork/keyring-connect-sdk` with both direct and session-backed verification routes.

## Quick Start

```bash
pnpm dev
pnpm build
pnpm lint
```

## Key Paths

| Task | Read first |
| --- | --- |
| Shared demo shell | `src/components/demo/XLendDemoPage.tsx` |
| Transport-specific launch logic | `src/components/demo/KeyringConnectModule/index.tsx` |
| Direct flow route | `src/app/page.tsx` |
| Session-backed route | `src/app/session-api/page.tsx` |
| Server token mint route | `src/app/api/connect/client-token/route.ts` |

## Runtime Split

- `/` is the direct desktop `chromeApi` route.
- `/session-api` is the backend-session `sessionApi` route.
- Both routes share the same post-verification credential update path.

## Implementation Rules

- Keep the two routes documented separately and accurately.
- Keep the token mint route server-side; never move `KEYRING_API_KEY` into browser-exposed config.
- Keep the post-verification lending flow shared unless the transport boundary truly requires divergence.

## Pitfalls

- Do not document `sessionApi` completion as a direct extension return.
- Do not let the route docs drift from the actual page entrypoints.
