import type { ExtensionState } from "@keyringnetwork/keyring-connect-sdk";

// SDK 3.2 passes extension state through unchanged. This is the 3.3 wire contract;
// use its exported type when 3.3 is published (no unpublished package dependency).
export type ProofData = { nonce: string; policyId: number; entityId: string };
export type ProofDataExtensionState = ExtensionState & { proofData?: ProofData };

export function supportsDataSharing(version: unknown): boolean {
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version)) {
    return false;
  }
  const [major, minor] = version.split(".").map(Number);
  return major > 7 || (major === 7 && minor >= 6);
}

export function validProofData(
  value: ProofData | undefined,
  policyId: number,
): value is ProofData {
  return !!value && value.policyId === policyId &&
    typeof value.nonce === "string" && /^[a-f0-9]{64}$/.test(value.nonce) &&
    typeof value.entityId === "string" && value.entityId.length > 0;
}
