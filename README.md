# Keyring Frontend Public

> Public monorepo for Keyring example apps and frontend-published packages.

## Overview

This repo contains the reference apps used to demonstrate public Keyring SDK integration patterns and a lightweight published frontend package.

- `examples/data-sharing-demo` is the reference app for the data-sharing SDK.
- `examples/keyring-connect-xlend` is the reference app for `chromeApi` and `sessionApi` connect flows.
- `examples/l1` is a smaller L1-focused credential example.
- `packages/keyring-zkpg-sdk` is the reusable published package in this repo.

## Quick Start

```bash
pnpm install
pnpm build
pnpm lint
```

## Documentation

| Area                        | Start here                                                                               | Then read                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Data-sharing reference app  | [`examples/data-sharing-demo/README.md`](./examples/data-sharing-demo/README.md)         | [`examples/data-sharing-demo/docs/README.md`](./examples/data-sharing-demo/docs/README.md)         |
| Connect/xLend reference app | [`examples/keyring-connect-xlend/README.md`](./examples/keyring-connect-xlend/README.md) | [`examples/keyring-connect-xlend/docs/README.md`](./examples/keyring-connect-xlend/docs/README.md) |

## Notes

- The connect-focused demos are the canonical references for `connect-sdk` and `data-sharing-sdk` usage in this repo.
- Linked SDK dependencies can point examples at local package builds, so local SDK changes may require rebuilding before demo behavior matches code.
