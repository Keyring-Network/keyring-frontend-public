# Data Sharing Demo

> Reference integration for `@keyringnetwork/data-sharing-sdk` with a browser app and a lightweight backend.

## Overview

This demo shows the full partner split:

- a Next.js frontend creates sessions, renders QR or extension flows, and shows progress
- an Express backend proxies partner information, stores demo session state, and receives signed Keyring webhooks

## Quick Start

```bash
pnpm install
pnpm --filter data-sharing-backend dev
pnpm --filter data-sharing-frontend dev
```

## Documentation

- [Docs index](./docs/README.md)
- [Architecture](./docs/architecture.md)
- [Integration Guide](./docs/integration-guide.md)

## Notes

- This is a reference integration, not a production backend template.
- Browser and backend responsibilities are intentionally split and documented separately.
