import { KEYRING_CONTRACT_ABI, getKeyringContractAddress } from "@/constant";
import { useMemo } from "react";
import { useAccount, useChains } from "wagmi";
import { useReadContract } from "wagmi";

type CheckCredentialResult = {
  hasValidCredential: boolean;
  status: "valid" | "no-credential" | "loading" | "error";
  error: Error | null;
  refetch: () => void;
};

export const useCheckCredential = (policyId: number): CheckCredentialResult => {
  const { address, chainId } = useAccount();
  const chains = useChains();
  const { data, isPending, isError, error, refetch } = useReadContract({
    address: getKeyringContractAddress(chainId) as `0x${string}`,
    abi: KEYRING_CONTRACT_ABI,
    functionName: "checkCredential",
    args: [address!, policyId],
    query: {
      enabled: !!address && chains.some((chain) => chain.id === chainId),
    },
  });

  const hasChecked = !isPending && !isError;
  const hasValidCredential = data === true;

  const status = useMemo(() => {
    if (hasValidCredential) return "valid";
    if (hasChecked) return "no-credential";
    if (isPending) return "loading";
    return "error";
  }, [hasValidCredential, hasChecked, isPending]);

  return {
    hasValidCredential,
    status,
    error,
    refetch,
  };
};
