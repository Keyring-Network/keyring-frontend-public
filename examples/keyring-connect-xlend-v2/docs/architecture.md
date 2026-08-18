# xLend Demo Architecture

> Scope: the reference lending-style app for `@keyringnetwork/keyring-connect-sdk`.

## System Context

This demo shows how a product UI can support both direct extension verification and session-backed verification without changing the downstream credential-update flow. It is the main reference app for `connect-sdk` integration in this repo.

## System At A Glance

| Area | Owns | Key paths |
| --- | --- | --- |
| Shared page shell | app frame, flow state, transport label | `src/components/demo/XLendDemoPage.tsx` |
| Verification module | launch logic, transport branching, completion handling | `src/components/demo/KeyringConnectModule/` |
| Direct route | `chromeApi` reference path | `src/app/page.tsx` |
| Session route | `sessionApi` reference path | `src/app/session-api/page.tsx` |
| Server token route | short-lived client token minting | `src/app/api/connect/client-token/route.ts` |

## Flow Variants

- `chromeApi`: direct desktop extension flow, no backend session, no client token.
- `sessionApi`: session-backed flow with a server-minted client token and extension-or-mobile continuation.

## Key Boundaries

- Browser route code owns demo UX and transport choice.
- The server route owns long-lived API-key usage and client-token minting.
- Both routes share the post-verification credential update flow.

## Implementation Pointers

- Start in `src/components/demo/KeyringConnectModule/index.tsx` for transport-aware launch behavior.
- Use `src/app/page.tsx` and `src/app/session-api/page.tsx` as the source of truth for route differences.
