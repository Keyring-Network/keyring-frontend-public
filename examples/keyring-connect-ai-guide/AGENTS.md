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
  trader: string;       // Wallet address that was verified
  policyId: number;     // Policy the credential is for
  chainId: number;      // Chain the credential targets
  validUntil: number;   // Expiry timestamp (seconds)
  cost: bigint;         // Credential fee in wei -- send as tx value
  key: string;          // Cryptographic key from verification
  signature: string;    // Signed proof from extension
  backdoor: string;     // Protocol field (pass as-is)
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

const { address: contractAddress, abi } = getKrnDeploymentArtifact({
  chainId,
  env: "prod",
});

// wagmi useReadContract
const { data: entityExp } = useReadContract({
  address: contractAddress,
  abi,
  functionName: "entityExp",
  args: [policyId, userAddress],
});

const status = deriveKeyringCredentialStatus(entityExp ?? 0n);
```

**Important:** `entityExp` is the only on-chain read your frontend needs. `checkCredential` is for contract-to-contract gating (includes blacklist check) -- not needed in frontend code.

---

## 5. Extension Subscription + Validation

```typescript
useEffect(() => {
  const unsubscribe = KeyringConnect.subscribeToExtensionState((state) => {
    if (state === null) {
      // Extension not installed
      setFlowState("install");
      return;
    }

    const { credentialData } = state;

    // Validate returned data matches current context
    if (credentialData.trader.toLowerCase() !== address?.toLowerCase()) {
      console.error("credentialData.trader doesn't match connected wallet");
      return;
    }
    if (credentialData.chainId !== activeChainId) {
      console.error("credentialData.chainId doesn't match active chain");
      return;
    }
    if (credentialData.policyId !== POLICY_ID) {
      console.error("credentialData.policyId doesn't match expected policy");
      return;
    }

    setCredentialData(credentialData);
    setFlowState("calldata-ready");
  });

  return () => unsubscribe();
}, [address, activeChainId]);
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
KeyringConnect.launchExtension({
  app_url: window.location.origin,
  name: KEYRING_CONFIG.appName,
  logo_url: KEYRING_CONFIG.logoUrl,
  policy_id: KEYRING_CONFIG.policyId,
  credential_config: {
    chain_id: chainId,          // e.g., 1 for Ethereum, 42161 for Arbitrum
    wallet_address: userAddress, // connected wallet address
  },
});
// Handles both install (redirects to Chrome Web Store) and launch
```

---

## 7. Submit createCredential Transaction

```typescript
const { writeContract } = useWriteContract();

writeContract({
  address: contractAddress,
  abi,
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
  value: credentialData.cost, // Credential fee in wei
});
```

`cost` is the credential fee denominated in wei (EVM) or lamports (Solana). It is set by the policy and included in the signed `credentialData`.

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
    to: keyringContractAddress,
    data: encodeFunctionData({
      abi: keyringAbi,
      functionName: "createCredential",
      args: [trader, policyId, chainId, validUntil, cost, key, signature, backdoor],
    }),
    value: cost,
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
    address: keyringContractAddress,
    abi: keyringAbi,
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
                                --> "no-credential" --> "install" (no extension)
                                                    --> "start"   (has extension)
                                --> "start" (expired credential -- renewal flow)
                                --> "error"

"install" --> [user installs] --> "start"
"start"   --> [user clicks Start Verification] --> "progress"
"progress" --> [extension returns credentialData] --> "calldata-ready"
"calldata-ready" --> [user clicks Update Credential] --> "transaction-pending"
"transaction-pending" --> [tx confirmed] --> "valid"
```

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

