import { useEffect, useState } from "react";
import { KeyringConnect } from "@keyringnetwork/keyring-connect-sdk";
import {
  ProofData,
  ProofDataExtensionState,
  validProofData,
} from "@/lib/proofData";

/**
 * Subscribes to the Keyring Connect extension and returns the proof data of
 * the latest verification for the given policy, or null when there is none.
 *
 * The extension only exposes proof data to the origin that launched it, only
 * for the current launch session, and clears it on every new launch. This hook
 * adds the policy check on top and otherwise passes the extension state through.
 */
export const useProofData = (policyId: number): ProofData | null => {
  const [proofData, setProofData] = useState<ProofData | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = KeyringConnect.subscribeToExtensionState(
      (state: ProofDataExtensionState | null) => {
        if (!active) return;
        const proof = state?.proofData;
        setProofData(validProofData(proof, policyId) ? proof : null);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [policyId]);

  return proofData;
};
