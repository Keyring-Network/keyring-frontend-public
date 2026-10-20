# Keyring Connect -- AI Integration Guide

## Preview Components

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see all UI components in every state.
Visit [http://localhost:3000/variant-c](http://localhost:3000/variant-c) for the custom integration example (in-context deposit card).

## Integrate with AI

### 1. Clone the reference code

```bash
git clone https://github.com/Keyring-Network/keyring-frontend-public.git
cd keyring-frontend-public/examples/keyring-connect-ai-guide
```

### 2. Point your AI assistant at the code

Open this folder as a working directory (or add it to your context) in your AI coding tool:

- **Claude Code:** `cd` into this folder, or reference it with `@examples/keyring-connect-ai-guide`
- **Cursor / Windsurf:** Open this folder alongside your project so the AI can read the files
- **Other tools:** Make sure the AI can access `AGENTS.md`, `src/components/`, and `src/lib/`

The AI needs to read the actual source files -- `AGENTS.md` has the full integration guide (types, patterns, hooks, code examples), and `src/` has copy-paste-ready components.

### 3. Send the prompt

Paste the following into your AI assistant. Fill in the `[bracketed]` placeholders with your project details.

````markdown
### Integrate Keyring Connect into my dApp

Read `AGENTS.md` at `[/path/to/keyring-frontend-public/examples/keyring-connect-ai-guide/AGENTS.md]` for the full integration reference (types, hooks, patterns, code). Copy the UI components from its `src/components/` and types/utils from its `src/lib/` into my project.

**My project:** I'm building a [React/Next.js] dApp using [wagmi/viem | @solana/web3.js | both] for chain interaction and [wallet adapter] for wallet connectivity.

| Decision | Value |
|----------|-------|
| On-chain policy ID (`policy.onchain_id`) | [YOUR_ONCHAIN_POLICY_ID] |
| Environment | [prod / dev; use matching policies, contracts, and extension endpoints] |
| Chain ID | [YOUR_CHAIN_ID, e.g. 1 for Ethereum, 42161 for Arbitrum] |
| Target chains | [EVM only / Solana only / both] |
| UI pattern | [Variant A (Module Card) / Variant B (CTA Cycling) / Variant C (Custom in-context card)] |
| Main CTA | [Action to gate, e.g. "Lend" or "src/components/LendingForm.tsx"] |
| Tx strategy | [Two-step (simpler) / Batched (recommended, one signature)] |

**Steps:**
1. Install: `pnpm add @keyringnetwork/keyring-connect-sdk wagmi viem @tanstack/react-query lucide-react clsx tailwind-merge`
2. Set up WagmiProvider + QueryClientProvider
3. Copy `keyring-types.ts`, `keyring-utils.ts`, and the components I need. Merge `theme.extend.colors.keyring` from the reference `tailwind.config.ts`, include the copied files in Tailwind content paths, enable Tailwind CSS, and copy `public/images/keyring/` to my public assets. Configure `@/` imports or convert them to relative paths. Use my app’s existing font.
4. Read credential: `entityExp(policyId, address)` -> `deriveKeyringCredentialStatus()`
5. Subscribe to extension: `KeyringConnect.subscribeToExtensionState()` with wallet, chain, on-chain policy ID, and expiry validation
6. Launch extension: `KeyringConnect.launchExtension(config)` with the on-chain policy ID as `policy_id`; for dev, configure the matching `krn_config` endpoints as shown in `AGENTS.md`
7. Submit credential: `createCredential(...)` with `value: cost`
8. Gate CTA behind `status.state === "keyring:valid"`
9. Handle refresh flow for expired credentials
10. For production: batch createCredential + main action into one tx
````

## Styling and assets when copying components

- These components use Tailwind CSS 3. Merge `theme.extend.colors.keyring` from `tailwind.config.ts` into your app's theme and include the copied files in Tailwind's `content` paths. Keep your existing theme settings. For Tailwind 4, translate these values into equivalent color tokens before use.
- Copy `public/images/keyring/` into your app's public assets so `/images/keyring/keyring-icon.jpg` and `/images/keyring/keyring-logo-dark.svg` resolve. Adjust the URLs for apps served under a base path.
- Enable Tailwind's base, components, and utilities layers (see `src/app/globals.css`). Use your app's font, or configure the font variable used by this example's layout.
- Configure `@/` to point at your source directory, or replace the copied components' aliases with relative imports.
- The reusable components support plain React and Next.js. The showcase pages and layout use Next.js; do not copy those into a plain React app.

## Checks

Run `pnpm test`, `pnpm lint`, and `pnpm build` from this directory. Tests execute the published subscription/launch snippets and render the credential submission states without Next.js imports.
