# AGENTS.md

> Agent-specific context for Keyring Frontend Public — the monorepo for public-facing example apps and frontend packages.

## Overview

This repo exists to show how Keyring frontend packages are used in practice. The primary reference surfaces are the connect-focused demos:

- `examples/data-sharing-demo`
- `examples/keyring-connect-xlend`

`examples/l1` and `packages/keyring-zkpg-sdk` are lighter-weight surfaces and should stay documented accordingly.

## Structure

```text
/                      # Monorepo root
├── examples/          # Public example apps
│   ├── data-sharing-demo/
│   ├── keyring-connect-xlend/
│   └── l1/
└── packages/          # Reusable frontend packages
    └── keyring-zkpg-sdk/
```

## Where to Look

| Task                               | Read first                                 | Then check                                      |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| Data-sharing reference integration | `examples/data-sharing-demo/README.md`     | `examples/data-sharing-demo/docs/README.md`     |
| Connect SDK reference integration  | `examples/keyring-connect-xlend/README.md` | `examples/keyring-connect-xlend/docs/README.md` |

## Conventions

- Keep example docs aligned with the current public SDK contracts.
- Keep READMEs short and use local docs indexes where detailed guides exist.
- Preserve real env var names and package scripts from each module.
- Make browser/server responsibility boundaries explicit when a demo has both runtimes.
- Treat browser-exposed API keys as a documentation and security bug unless the example is intentionally server-only.

## Anti-Patterns

- Do not let example docs drift from the actual SDK auth/session model.
- Do not document a demo as production-ready when it is intentionally reference-only.
- Do not duplicate repo-wide guidance in nested AGENTS files.
- Do not edit `CODEOWNERS`.

## Commands

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

## Workflow Gotchas

1. Root dependencies point SDK consumption at linked packages, so local SDK changes can affect example behavior immediately.
2. The examples do not share one toolchain: some are Next.js apps, some include backend services, and packages have their own build systems.
3. Demo build failures may come from remote font or networked build steps; separate those from actual integration regressions.
4. The connect-focused demos are the source of truth for current public SDK integration patterns in this repo.

## Notes

- Check nested `AGENTS.md` files before editing under `examples/` or `packages/`.
- Use the module docs indexes for the detailed reading order of the two major demos.
