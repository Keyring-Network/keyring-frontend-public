# Keyring Connect -- AI Integration Guide

## Preview Components

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see all UI components in every state.
Visit [http://localhost:3000/variant-c](http://localhost:3000/variant-c) for the custom integration example (in-context deposit card).

## Integrate with AI

Copy the prompt below into your AI coding assistant (Claude, Cursor, etc.). Fill in the `[bracketed]` placeholders, then point the AI at [AGENTS.md](./AGENTS.md) for full implementation details.

````markdown
### Integrate Keyring Connect into my dApp

**Context:** I need to add Keyring Connect verification to my [React/Next.js] dApp. The dApp uses [wagmi/viem | @solana/web3.js | both] for chain interaction and [wallet adapter] for wallet connectivity.

**What Keyring Connect does:** It gates a permissioned action behind an on-chain KYC credential. Users verify via a Chrome extension, then a credential is created on-chain with a ~24h TTL.

**Reference implementation:** Copy UI components from `src/components/` and types from `src/lib/` in this project. See `AGENTS.md` for full type definitions, patterns, and code examples.

<!-- Fill in your project details: -->

| Decision | Value |
|----------|-------|
| Policy ID | [YOUR_POLICY_ID] |
| Chain ID | [YOUR_CHAIN_ID, e.g. 1 for Ethereum, 42161 for Arbitrum] |
| Target chains | [EVM only / Solana only / both] |
| UI pattern | [Variant A (Module Card -- Keyring-branded, appears/disappears) / Variant B (CTA Cycling -- your own card, button text changes) / Variant C (Custom -- in-context card that transforms during verification)] |
| Main CTA | [Action name or component path, e.g. "Lend" or "src/components/LendingForm.tsx -- the \<SubmitButton\> to gate"] |
| Tx strategy | [Two-step (simpler, two signatures) / Batched (recommended, one signature)] |

**Steps:**
1. Install: `pnpm add @keyringnetwork/keyring-connect-sdk wagmi viem @tanstack/react-query lucide-react clsx tailwind-merge`
2. Set up WagmiProvider + QueryClientProvider
3. Copy `keyring-types.ts`, `keyring-utils.ts`, and the components you need
4. Read credential: `entityExp(policyId, address)` → `deriveKeyringCredentialStatus()`
5. Subscribe to extension: `KeyringConnect.subscribeToExtensionState()` with trader/chain/policy validation
6. Launch extension: `KeyringConnect.launchExtension(config)`
7. Submit credential: `createCredential(trader, policyId, chainId, validUntil, cost, key, signature, backdoor)` with `value: cost`
8. Gate CTA behind `status.state === "keyring:valid"`
9. Handle refresh flow for expired credentials
10. For production: batch createCredential + main action into one tx
````
