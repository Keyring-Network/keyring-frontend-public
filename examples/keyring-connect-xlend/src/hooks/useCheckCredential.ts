import { useAppKitNetwork } from "@reown/appkit/react";
import { useCheckCredentialEvm } from "./useCheckCredentialEvm";
import { useCheckCredentialSolana } from "./useCheckCredentialSolana";

type CheckCredentialResult = {
  hasValidCredential: boolean;
  status: "valid" | "no-credential" | "loading" | "error" | "expired";
  error: Error | null;
  refetch: () => void;
};

export const useCheckCredential = (policyId: number): CheckCredentialResult => {
  const { caipNetworkId } = useAppKitNetwork();

  const {
    hasValidCredential: hasValidCredentialEvm,
    status: statusEvm,
    error: errorEvm,
    refetch: refetchEvm,
  } = useCheckCredentialEvm(policyId);
  const {
    hasValidCredential: hasValidCredentialSolana,
    status: statusSolana,
    error: errorSolana,
    refetch: refetchSolana,
  } = useCheckCredentialSolana(policyId);

  const isSolanaConnected = caipNetworkId?.startsWith("solana");

  console.log("credential status", {
    caipNetworkId,
    statusEvm,
    statusSolana,
    errorEvm,
    errorSolana,
    hasValidCredentialEvm,
    hasValidCredentialSolana,
  });

  return {
    hasValidCredential: isSolanaConnected
      ? hasValidCredentialSolana
      : hasValidCredentialEvm,
    status: isSolanaConnected ? statusSolana : statusEvm,
    error: isSolanaConnected ? errorSolana : errorEvm,
    refetch: isSolanaConnected ? refetchSolana : refetchEvm,
  };
};
