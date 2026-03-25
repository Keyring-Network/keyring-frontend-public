# Data Sharing Demo — Documentation

> Operator-facing docs for the combined browser and backend reference integration.

## Overview

These docs explain how the data-sharing demo is split between the browser and backend, how the flow works end to end, and where to debug or extend it.

## How to Read These Docs

1. Start with [Architecture](./architecture.md) to understand the browser/backend split.
2. Read [Integration Guide](./integration-guide.md) to run the demo locally and configure the env files.
3. Read [Technical Guide](./technical-guide.md) before changing the frontend or backend behavior.

## Architecture

- [Architecture](./architecture.md) — runtime pieces, flow variants, trust boundaries

## Integration

- [Integration Guide](./integration-guide.md) — setup, env, responsibilities split, common mistakes

## Technical

- [Technical Guide](./technical-guide.md) — code layout, contracts, build workflow, maintenance notes

## Quick Links

| Task | Start here |
| --- | --- |
| Understand which runtime owns which responsibility | [Architecture](./architecture.md) |
| Run the frontend and backend together | [Integration Guide](./integration-guide.md) |
| Debug session or webhook behavior | [Technical Guide](./technical-guide.md) |
