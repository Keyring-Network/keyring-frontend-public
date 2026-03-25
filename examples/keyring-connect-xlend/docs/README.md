# xLend Demo — Documentation

> Operator-facing docs for the lending-style reference app built on `connect-sdk`.

## Overview

These docs explain how the xLend demo supports both direct extension verification and session-backed verification while keeping a shared post-verification product flow.

## How to Read These Docs

1. Start with [Architecture](./architecture.md) to understand the route split and token boundary.
2. Read [Integration Guide](./integration-guide.md) to run the demo and configure env values.
3. Read [Technical Guide](./technical-guide.md) before changing routes, transport handling, or the token mint path.

## Architecture

- [Architecture](./architecture.md) — shared shell, route variants, trust boundaries

## Integration

- [Integration Guide](./integration-guide.md) — env setup, route responsibilities, common mistakes

## Technical

- [Technical Guide](./technical-guide.md) — code layout, route contracts, build workflow, maintenance notes

## Quick Links

| Task | Start here |
| --- | --- |
| Understand `chromeApi` vs `sessionApi` in the demo | [Architecture](./architecture.md) |
| Configure the token mint route safely | [Integration Guide](./integration-guide.md) |
| Change route behavior or shared UI safely | [Technical Guide](./technical-guide.md) |
