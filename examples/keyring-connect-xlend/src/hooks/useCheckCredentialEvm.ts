import { networks } from "@/config";
import {
  getKrnDeploymentArtifact,
  KrnSupportedChainId,
} from "@keyringnetwork/keyring-connect-sdk";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { useEnvironmentStore } from "./store/useEnvironmentStore";

type CheckCredentialResult = {
  hasValidCredential: boolean;
  status: "valid" | "no-credential" | "loading" | "error" | "expired";
  error: Error | null;
  refetch: () => void;
};

export const useCheckCredentialEvm = (
  policyId: number
): CheckCredentialResult => {
  const { address } = useAppKitAccount();
  const { caipNetworkId, chainId } = useAppKitNetwork();
  const { environment } = useEnvironmentStore();

  const contract = getKrnDeploymentArtifact({
    chainId: (chainId || 1) as KrnSupportedChainId,
    env: environment,
  });

  const isEnabled = useMemo(() => {
    return (
      !!address &&
      networks.some((network) => network.id === chainId) &&
      caipNetworkId?.startsWith("eip155")
    );
  }, [address, chainId, caipNetworkId]);

  const { data, isPending, isError, error, refetch } = useReadContract({
    address: contract.address as `0x${string}`,
    abi: contract.ABI || [],
    functionName: "entityExp",
    args: [policyId, address!],
    query: {
      enabled: isEnabled,
    },
  });

  const hasValidCredential = useMemo(() => {
    if (!data) return false;
    const expiryTimestamp = Number(data);
    const currentTime = Math.floor(Date.now() / 1000);
    return expiryTimestamp > 0 && currentTime < expiryTimestamp;
  }, [data]);

  const status = useMemo(() => {
    if (isPending) return "loading";
    if (isError) return "error";
    if (!isEnabled || data === undefined) return "no-credential";

    const expiryTimestamp = Number(data);
    const currentTime = Math.floor(Date.now() / 1000);

    if (expiryTimestamp > 0 && currentTime > expiryTimestamp) {
      return "expired";
    } else if (expiryTimestamp > 0 && currentTime < expiryTimestamp) {
      return "valid";
    } else {
      return "no-credential";
    }
  }, [isEnabled, data, isPending, isError]);

  return {
    hasValidCredential,
    status,
    error,
    refetch,
  };
};
