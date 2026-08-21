# Keyring Connect -- AI Integration Reference

> Structured for AI coding assistants. Front-loads types, patterns, and code. Conceptual sections follow.

**What Keyring Connect is:** A privacy-preserving KYC verification system for DeFi. It gates dApp actions behind on-chain compliance credentials. Users verify via a Chrome extension (TLSN-Proof against KYC sources like Binance), then a credential is created on-chain with a ~24h TTL. No identity data is exposed to the dApp. The integrator needs a **Policy ID** from [Keyring Network](https://keyring.network).

**Sources for integration:**

| Source | What it provides |
|--------|-----------------|
| `@keyringnetwork/keyring-connect-sdk` | Extension communication (`subscribeToExtensionState`, `launchExtension`), contract ABIs, chain config (`getKrnDeploymentArtifact`), `CredentialData` type |
| `src/components/` (this project) | Copy-paste UI components: badge, module cards (Variant A/B), gated CTA. Pure presentational, no SDK/wallet deps. |
| `src/lib/` (this project) | Shared types (`KeyringFlowState`, `KeyringCredentialStatus`) and `deriveKeyringCredentialStatus` helper |
| [xLend showcase](https://github.com/Keyring-Network/keyring-frontend-public/tree/master/examples/keyring-connect-xlend) | Full working integration with wagmi hooks, wallet connection, credential read/write, Solana support. Adapt `hooks/useCheckCredentialEvm.ts` and `hooks/useCredentialUpdateEvm.tsx` for your project. |

**Supported chains:** Ethereum, Arbitrum, Base, Optimism, Avalanche, Polygon, Linea, Solana. Contract addresses are resolved automatically by `getKrnDeploymentArtifact({ chainId, env: "prod" })`.

---

## 1. Types

```typescript
// src/lib/keyring-types.ts

type KeyringCredentialStatus =
  | { state: "keyring:none" }                      // entityExp === 0 → first-time user
  | { state: "keyring:valid"; expiresAt: Date }    // entityExp > now → access granted
  | { state: "keyring:expired"; expiredAt: Date }; // entityExp > 0 && <= now → renewal flow

type KeyringFlowState =
  | "loading"             // Checking on-chain credential
  | "error"               // Error state
  | "no-credential"       // No credential found, checking extension
  | "install"             // Extension not installed
  | "start"               // Ready to start verification
  | "progress"            // Verification in progress in extension
  | "calldata-ready"      // Extension returned credentialData, ready to submit tx
  | "transaction-pending" // Transaction submitted, waiting for confirmation
  | "valid";              // Valid credential, access granted

// Returned by KeyringConnect.subscribeToExtensionState()
interface CredentialData {
  trader: `0x${string}`; // Wallet address that was verified
  policyId: number;      // Policy the credential is for
  chainId: number;       // Chain the credential targets
  validUntil: number;    // Expiry timestamp (seconds)
  cost: number;          // Credential fee in wei -- wrap with BigInt() for tx value
  key: string;           // Cryptographic key from verification
  signature: string;     // Signed proof from extension
  backdoor: string;      // Protocol field (pass as-is)
}
// Maps to createCredential contract args:
// [trader, policyId, chainId, validUntil, cost, key, signature, backdoor]
```

---

## 2. Credential Status Helper

```typescript
// src/lib/keyring-utils.ts

function deriveKeyringCredentialStatus(entityExp: bigint): KeyringCredentialStatus {
  if (entityExp === 0n) return { state: "keyring:none" };
  const expDate = new Date(Number(entityExp) * 1000);
  if (expDate > new Date()) return { state: "keyring:valid", expiresAt: expDate };
  return { state: "keyring:expired", expiredAt: expDate };
}
```

Usage:
```typescript
const entityExp = useReadContract({ ... }); // wagmi hook reading entityExp(policyId, address)
const status = deriveKeyringCredentialStatus(entityExp.data ?? 0n);

switch (status.state) {
  case "keyring:none":    // Show verification flow
  case "keyring:expired": // Show renewal flow (status.expiredAt available)
  case "keyring:valid":   // Show main CTA (status.expiresAt available)
}
```

---

## 3. Provider Setup

```typescript
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
// wagmiConfig setup depends on your wallet adapter. See wagmi docs.
```

---

## 4. On-Chain Credential Read

Use `entityExp(policyId, wallet)` on the Keyring contract:

```typescript
import { getKrnDeploymentArtifact } from "@keyringnetwork/keyring-connect-sdk";

const { address: contractAddress, ABI } = getKrnDeploymentArtifact({
  chainId,
  env: "prod",
});

// wagmi useReadContract
const { data: entityExp } = useReadContract({
  address: contractAddress as `0x${string}`,
  abi: ABI ?? [],
  functionName: "entityExp",
  args: [policyId, userAddress],
});

const status = deriveKeyringCredentialStatus(entityExp ?? 0n);
```

**Important:** `entityExp` is the only on-chain read your frontend needs. `checkCredential` is for contract-to-contract gating (includes blacklist check) -- not needed in frontend code.

---

## 5. Extension Subscription + Validation

**The subscription should run continuously** (not only during active verification). The extension caches `credentialData` between page loads — a continuous subscription picks it up on re-mount, so the user resumes at `calldata-ready` after a page refresh instead of restarting the flow.

```typescript
useEffect(() => {
  if (!address) return;

  const unsubscribe = KeyringConnect.subscribeToExtensionState((state) => {
    if (state === null) {
      // Extension not installed — track this, but don't change flowState here.
      // Show "install" only when the user actively enters the verification flow
      // (i.e., after clicking "Start Verification" and launchExtension() catches).
      setExtensionInstalled(false);
      return;
    }

    setExtensionInstalled(true);

    const { credentialData } = state;
    if (!credentialData) return;

    // Validate returned data matches current context
    if (credentialData.trader.toLowerCase() !== address.toLowerCase()) return;
    if (credentialData.chainId !== activeChainId) return;
    if (credentialData.policyId !== POLICY_ID) return;

    setCredentialData(credentialData);
    setFlowState("calldata-ready");
  });

  return () => unsubscribe();
}, [address]);
```

**Key behaviors:**
- **Credential data takes priority:** If the extension returns valid `credentialData`, always transition to `calldata-ready` — even if the credential-status check is still loading.
- **Don't auto-transition to `install`/`start`:** Setting `flowState("install")` inside the subscription during Step 0 will cause unwanted UI jumps. Track installation status separately; only surface it when the user clicks "Start Verification."
- **Wallet change invalidation:** When `address` changes, clear `credentialData` and reset `flowState`. The subscription will re-evaluate with the new address, and mismatched `trader` values will be silently ignored.

```typescript
// Reset all state when wallet changes
useEffect(() => {
  setCredentialData(null);
  setFlowState("loading");
}, [address]);
```

---

## 6. Configuration + Launch Extension

```typescript
// Define once per dApp
const KEYRING_CONFIG = {
  policyId: YOUR_POLICY_ID, // Get from Keyring Network
  appName: "Your dApp",
  logoUrl: "https://yourdapp.com/logo.svg",
};
```

```typescript
// Launch extension (call when user clicks "Start Verification")
// IMPORTANT: Check for existing credentialData first — re-launching can clear the
// extension's cached state. If credentialData exists, skip to "calldata-ready".
if (credentialData) {
  setFlowState("calldata-ready");
  return;
}

setFlowState("progress");
KeyringConnect.launchExtension({
  app_url: window.location.origin,
  name: KEYRING_CONFIG.appName,
  logo_url: KEYRING_CONFIG.logoUrl,
  policy_id: KEYRING_CONFIG.policyId,
  credential_config: {
    chain_id: chainId,          // e.g., 1 for Ethereum, 42161 for Arbitrum
    wallet_address: userAddress, // connected wallet address
  },
}).catch(() => {
  setFlowState("install"); // Extension not found, redirect happened
});
// Handles both install (redirects to Chrome Web Store) and launch
```

---

## 7. Submit createCredential Transaction

```typescript
const { writeContract } = useWriteContract();

writeContract({
  address: contractAddress as `0x${string}`,
  abi: ABI ?? [],
  functionName: "createCredential",
  args: [
    credentialData.trader,
    credentialData.policyId,
    credentialData.chainId,
    credentialData.validUntil,
    credentialData.cost,
    credentialData.key,
    credentialData.signature,
    credentialData.backdoor,
  ],
  value: BigInt(credentialData.cost), // cost is number, wrap with BigInt for tx value
});
```

`cost` is the credential fee denominated in wei (EVM) or lamports (Solana). The SDK returns `cost` as `number` — wrap with `BigInt()` when passing as tx `value`. It is set by the policy and included in the signed `credentialData`.

---

## 8. Error Handling

```typescript
// 1. User rejected transaction
try {
  await writeContract({ ... });
} catch (e) {
  if (e.name === "UserRejectedRequestError") {
    setFlowState("calldata-ready"); // Let user retry
    return;
  }
  setFlowState("error");
}

// 2. Simulation failure
if (simulationError) {
  // Show error to user, offer retry
  // Common causes: insufficient funds, wrong chain, expired credentialData
}

// 3. Mismatched credentialData -- handled in subscription validation (section 5)
```

---

## 9. Transaction Batching (Recommended)

Batch `createCredential` + main action into one transaction for better UX:

```typescript
import { encodeFunctionData } from "viem";

const txs = [];
if (status.state !== "keyring:valid" && credentialData) {
  txs.push({
    to: keyringContractAddress as `0x${string}`,
    data: encodeFunctionData({
      abi: ABI ?? [],
      functionName: "createCredential",
      args: [trader, policyId, chainId, validUntil, cost, key, signature, backdoor],
    }),
    value: BigInt(cost),
  });
}
txs.push({
  to: yourContractAddress,
  data: encodeFunctionData({ abi: yourAbi, functionName: "yourAction", args: [...] }),
});
// Submit as batched transaction via multicall or similar
```

---

## 10. Defensive Submit Guard

Re-check credential before submitting the gated action:

```typescript
const handleSubmit = async () => {
  const exp = await readContract({
    address: keyringContractAddress as `0x${string}`,
    abi: ABI ?? [],
    functionName: "entityExp",
    args: [policyId, wallet],
  });
  const status = deriveKeyringCredentialStatus(exp);
  if (status.state !== "keyring:valid") {
    return; // Force re-verification
  }
  // Proceed with action...
};
```

---

## 11. Reference Components

Copy from `src/components/` in this project:

| Component | Props | Variants |
|-----------|-------|----------|
| `KeyringVerificationBadge` | `status: KeyringCredentialStatus \| "loading"` | none, valid, expired, loading |
| `KeyringConnectModuleA` | `step, onAction, onCancel?, isSimulating?, featureName?` | install, start, progress, calldata-ready, refresh |
| `KeyringConnectModuleB` | `step, onAction, onCancel?` | install, verify, check-status, add-credential |
| `KeyringConnectModuleC` | `step, onAction, onCancel?` | supply, gate, install, verify, progress, verified, expired |
| `KeyringGatedCTA` | `state, actionLabel?, onClick?` | not-connected, not-verified, verified |

All are `"use client"`, named exports, Tailwind + lucide-react, zero SDK/wallet deps.

---

## 12. State Machine

```
[wallet connects] --> "loading" --> "valid" (has credential)
                                --> "no-credential" (none or expired)
                                --> "error"

[user action]     --> "progress" (launchExtension called)
                  --> "install"  (launchExtension catch, extension not found)

"progress"        --> [extension returns credentialData] --> "calldata-ready"
"calldata-ready"  --> [user clicks Submit Credential]   --> "transaction-pending"
"transaction-pending" --> [tx confirmed]                --> "valid"
```

**State priority:** The credential-status effect (on-chain `entityExp`) and the extension subscription can both set `flowState`. When they conflict:
- `"valid"` always wins -- if the on-chain credential is valid, override everything.
- Active verification states (`progress`, `install`, `calldata-ready`, `transaction-pending`) must not be overridden by credential-status setting `"loading"` or `"no-credential"`.
- `credentialData` from the extension subscription always transitions to `"calldata-ready"`, even if credential status is still `"loading"` (e.g., after page refresh).

---

## 12b. UI Flows (Variant C)

Conditional paths -- each starts at Step 0 (deposit form visible):

| Condition | Flow |
|-----------|------|
| No extension | 0 → gate → install → verify → progress → verified |
| Extension installed | 0 → gate → progress → verified |
| Already verified | Verified (persists across refreshes) |
| Credential expired | 0 (expired badge) → gate → progress → verified |

**Step 0 is always the entry point when credential is missing or expired.**
The gate view only appears after the user clicks the main CTA ("Supply USDC").
This is a local UI state, not an SDK state.

**ModuleCStep → flowState mapping:**

| UI Step | `flowState` values | Trigger | Deposit form |
|---------|--------------------|---------|--------------|
| Step 0 (`supply`) | `no-credential`, `loading` | Page load (wallet connected) | Visible |
| Gate (`gate`) | (local `showGate = true`) | User clicks "Supply USDC" | Faded (0.3) |
| Install (`install`) | `install` | `launchExtension()` catch | Hidden |
| Verify (`verify`) | `start` | Extension detected | Hidden |
| Progress (`progress`) | `progress` | `launchExtension()` called | Hidden |
| Calldata | `calldata-ready` | Extension returns data | Hidden |
| Tx Pending | `transaction-pending` | `submitCredential()` called | Hidden |
| Verified (`verified`) | `valid` | On-chain credential confirmed | Visible |

---

## 13. Component Map

**Variant A: Module Card Pattern**
```
Your dApp Page
  |-- [optional] KeyringVerificationBadge
  |-- Your Main UI
  |-- KeyringConnectModuleA (appears/disappears per state)
  |       |-- "Provided by Keyring" footer
  |-- KeyringGatedCTA (disabled until verified)
```

**Variant B: CTA Cycling Pattern**
```
Your dApp Page
  |-- [optional] KeyringVerificationBadge
  |-- Your Main UI
  |-- Persistent Info Card ("Auth Required")
  |-- CTA cycles: "Install" → "Verify" → "Check Status" → "Add Credential"
```

**Variant C: Custom Integration Example**
```
Your dApp Page
  |-- Deposit Card (transforms in-place per state)
  |       |-- Header: "Deposit USDC" + APY badge (deposit views)
  |       |-- Header: "Identity Verification" (verification views)
  |       |-- KeyringVerificationBadge (supply/verified/expired)
  |       |-- Stepper: ① Verify → ② Deposit USDC (gate/install/verify/progress)
  |       |-- Deposit form (full or faded) / Helper text
  |       |-- Verification notice (gate only)
  |       |-- CTA: cycles per step
```

**Variant C integration rules:**
1. **Progressive disclosure** -- show the deposit form first with a status badge. The verification gate only appears after the user clicks the main CTA.
2. **Step 0 for expired** -- expired credentials start at Step 0 (with "Access Expired" badge), not at the gate. Same progressive disclosure applies.
3. **Local gate state** -- the transition from Step 0 → Gate is a local UI state (`showGate`), not derived from `KeyringFlowState`. Cancel from gate returns to Step 0.
4. **Subscription runs continuously** -- the extension caches `credentialData` across page refreshes. The subscription must run at all times to pick up cached data and resume at `calldata-ready`. However, only `credentialData` should trigger flow transitions — don't auto-transition to `install`/`start` during Step 0 (track extension installation status separately).
5. **Preserve credentialData on cancel** -- when the user cancels from `calldata-ready`, reset the flow state but keep `credentialData`. On re-entry (clicking the main CTA again), check for existing `credentialData` and skip directly to `calldata-ready` instead of re-launching the extension (which may clear the cached data).
6. **Invalidate on wallet change** -- when the connected wallet address changes, clear `credentialData` and reset flow state to `loading`. The subscription validates `credentialData.trader` against the current address; mismatched data is silently ignored.

---

## 14. Hook Architecture

```
useKeyringCredential(policyId)             -- Router: dispatches to EVM or Solana
  |-- useKeyringCredentialEvm(policyId)      -- Reads entityExp via wagmi
  |-- useKeyringCredentialSolana(policyId)   -- Reads entityData via Anchor

useKeyringCredentialUpdate(credentialData) -- Router: dispatches to EVM or Solana
  |-- useKeyringCredentialUpdateEvm          -- Simulates + writes via wagmi
  |-- useKeyringCredentialUpdateSolana       -- Prepares + sends via Solana wallet
```

Single-chain integrators: use the chain-specific hooks directly to avoid pulling in unused dependencies.

---

## 15. Dependencies

| Package | Purpose | Required? |
|---------|---------|-----------|
| `@keyringnetwork/keyring-connect-sdk` | Extension communication, contract ABIs, chain config | Yes |
| `wagmi` + `viem` | EVM contract reads/writes | Yes (EVM) |
| `@coral-xyz/anchor` + `@solana/web3.js` | Solana program interaction | Yes (Solana) |
| `@tanstack/react-query` | Async state management | Recommended |
| Wallet adapter (e.g., `@reown/appkit`) | Wallet connectivity | Replaceable |

---

## 16. Production Requirements

1. **Chain is source of truth** -- always confirm credential status from `entityExp` on-chain, not from extension state
2. **Validate credentialData** -- check trader/chainId/policyId match before submitting tx
3. **Full tx lifecycle** -- receive credentialData → simulate (optional) → submit → wait for receipt → refetch credential
4. **Gate the action shell** -- replace the entire form with the verification card, don't just disable the button
5. **Defensive submit guards** -- re-read `entityExp` inside submit handler (see section 10)
6. **Handle runtime states** -- unsupported-network, expired credential
7. **Shared verification** -- one provider for all permissioned actions ("verify once, use the product")
8. **Ship all error states** -- expired, missing extension, rejected tx, unsupported network, config mismatch, mismatched credentialData, simulation failure, on-chain revert

---

## 17. User Flows

**First-time:** wallet connects → no credential → install extension (if needed) → start verification → extension returns credentialData → submit createCredential tx → credential valid → access granted

**Refresh:** expired credential → start verification → extension returns credentialData → submit tx → credential valid

**Access granted:** valid credential → user performs action → no Keyring UI shown

---

## 18. Development & Testing

- `env: "prod"` -- production contracts, real KYC
- `env: "dev"` -- development contracts, test policies

Pass `env: "dev"` to `getKrnDeploymentArtifact()` for development. The extension flow works identically in both environments.

