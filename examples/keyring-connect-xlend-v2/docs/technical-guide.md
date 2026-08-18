# xLend Demo Technical Guide

> Maintainer-facing notes for changing the connect reference app safely.

## Code Layout

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | direct `chromeApi` route |
| `src/app/session-api/page.tsx` | session-backed `sessionApi` route |
| `src/app/api/connect/client-token/route.ts` | server-side client-token mint route |
| `src/components/demo/KeyringConnectModule/` | launch behavior and post-verification actions |
| `src/components/demo/XLendDemoPage.tsx` | shared page shell |

## Important Types / Contracts

- Route-level transport choice is explicit: direct vs session-backed.
- The token route is the only place that should touch `KEYRING_API_KEY`.
- The returned verification payload feeds the same post-verification credential update flow regardless of route.

## Build and Test

```bash
pnpm build
pnpm lint
```

## Debugging / Maintenance Notes

- Keep the direct and session-backed flows visually similar but behaviorally distinct.
- If `connect-sdk` config changes, update both routes and the token mint path together.
- This app is a demo, but the auth boundary around `KEYRING_API_KEY` should be treated as production-sensitive documentation.
