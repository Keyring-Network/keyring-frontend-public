# xLend Demo Integration Guide

> Audience: operators using this demo to understand how `connect-sdk` fits into a product-style app shell.

## When to Use This

Use this demo when you want a concrete reference for:

- direct desktop `chromeApi` integration
- session-backed `sessionApi` integration
- server-side minting of `clientToken`
- handing verified calldata into an on-chain update flow

## Quick Start

1. Copy `.env.example` to `.env.local`.
2. Set:
   - `NEXT_PUBLIC_KEYRING_API_BASE_URL_DEV`
   - `NEXT_PUBLIC_KEYRING_API_BASE_URL_PROD`
   - `NEXT_PUBLIC_KEYRING_USER_APP_URL_DEV`
   - `KEYRING_API_KEY`
   - `NEXT_PUBLIC_REOWN_PROJECT_ID`
3. Start the app:

```bash
pnpm dev
```

## Required Configuration

- Browser-visible config selects Keyring base URLs, app URLs, and wallet setup.
- `KEYRING_API_KEY` is server-only and used by `/api/connect/client-token`.

## Responsibilities Split

| Route or runtime | Owns |
| --- | --- |
| `/` | direct desktop `chromeApi` demo |
| `/session-api` | session-backed `sessionApi` demo |
| `/api/connect/client-token` | long-lived API-key usage and short-lived client-token minting |

## Common Mistakes

- Exposing `KEYRING_API_KEY` in `NEXT_PUBLIC_*`
- Mixing `chromeApi` assumptions into the session-backed route
- Assuming `sessionApi` completion comes directly from extension launch instead of the session lifecycle

## Deep Dives

- [Architecture](./architecture.md)
- [Technical Guide](./technical-guide.md)
