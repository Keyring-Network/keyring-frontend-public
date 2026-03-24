# Keyring Connect xLend Demo

> Reference integration for `@keyringnetwork/keyring-connect-sdk` inside a lending-style app shell.

## Overview

This demo shows two supported connect paths using the same lending-style UI:

- `/` demonstrates the direct desktop `chromeApi` flow
- `/session-api` demonstrates the backend-session `sessionApi` flow with server-side client-token minting
- both routes converge on the same post-verification credential update path

## Quick Start

```bash
pnpm install
pnpm dev
```

## Documentation

- [Docs index](./docs/README.md)
- [Architecture](./docs/architecture.md)
- [Integration Guide](./docs/integration-guide.md)

## Notes

- `KEYRING_API_KEY` stays server-side and is used only by the local token-mint route.
- The browser never receives the long-lived API key.
