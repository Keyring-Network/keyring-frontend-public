# AGENTS.md — Examples

> Shared operating notes for the public reference applications.

## Structure

```text
examples/
├── data-sharing-demo/      # Browser + backend data-sharing reference app
├── keyring-connect-xlend/  # Connect SDK reference app with chromeApi and sessionApi routes
└── l1/                     # Lightweight L1 example
```

## Where to Look

| Task | Read first |
| --- | --- |
| Data-sharing demo split between browser and backend | `data-sharing-demo/AGENTS.md` |
| Connect SDK reference flows | `keyring-connect-xlend/AGENTS.md` |
| Lightweight example setup only | `l1/AGENTS.md` |

## Conventions

- Treat examples as reference integrations, not shared libraries.
- Keep browser/server responsibilities explicit whenever an example includes both runtimes.
- Keep SDK usage aligned with the current public package contracts and example code paths.

## Anti-Patterns

- Do not add package-publishing guidance under `examples/`.
- Do not let example READMEs become full SDK manuals.
- Do not hide security-sensitive trust boundaries, especially token minting and webhook verification.

## Commands

```bash
pnpm build
pnpm test
pnpm lint
```

## Workflow Gotchas

- Many examples depend on linked local SDK packages, so SDK rebuilds may be required before runtime behavior updates.
- Lightweight examples intentionally stay less documented; do not backfill them with deep architecture docs unless the code surface grows.

## Notes

- Example-local AGENTS files own flow-specific rules and exceptions.
