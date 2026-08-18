# AGENTS.md — Data Sharing Demo Frontend

> Next.js frontend for data-sharing session creation, realtime UX, and flow selection.

## Quick Start

```bash
pnpm run dev
pnpm run build
pnpm start
pnpm run lint
```

## Key Paths

| Task | Read first |
| --- | --- |
| Flow orchestration | `src/hooks/useDataSharing.ts` |
| Partner info bootstrap | `src/hooks/usePartnerInfo.ts` |
| Main route shell | `src/app/(home)/page.tsx` |
| Flow-specific UI | `src/app/(home)/components/` |

## Implementation Rules

- Keep the two UX branches explicit: mobile QR and desktop extension.
- Keep backend-only work out of frontend docs and code comments.
- Keep frontend flow docs aligned with the backend companion app when token or webhook responsibilities change.

## Pitfalls

- Do not document webhook handling as a frontend responsibility.
- Do not let route and component docs drift from the actual `useDataSharing` flow.
