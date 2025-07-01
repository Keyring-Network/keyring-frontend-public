import { networks } from "@/config";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { getEntityExp } from "@/lib/solana";
import { useEnvironmentStore } from "./store/useEnvironmentStore";

type CheckCredentialResult = {
  hasValidCredential: boolean;
  status: "valid" | "no-credential" | "loading" | "error" | "expired";
  error: Error | null;
  refetch: () => void;
};

export const useCheckCredentialSolana = (
  policyId: number
): CheckCredentialResult => {
  const { address } = useAppKitAccount();
  const { caipNetworkId, chainId } = useAppKitNetwork();
  const { connection } = useAppKitConnection();
  const queryClient = useQueryClient();
  const { environment } = useEnvironmentStore();

  // Create a query key that includes all dependencies
  const queryKey = useMemo(
    () => ["solanaCredentialCheck", caipNetworkId, policyId, address],
    [caipNetworkId, policyId, address]
  );

  const isEnabled = useMemo(() => {
    return (
      !!address &&
      !!connection &&
      networks.some((network) => network.id === chainId) &&
      caipNetworkId?.startsWith("solana")
    );
  }, [address, connection, chainId, caipNetworkId]);

  // Function to fetch entity expiration and check if credential is valid
  const fetchCredentialStatus = async () => {
    if (!connection || !address) {
      return { expiryTimestamp: 0, hasValid: false };
    }

    try {
      // Convert address to PublicKey
      const publicKey = new PublicKey(address);

      // Fetch entity expiration data
      const entityData = await getEntityExp(
        policyId,
        publicKey,
        connection,
        environment
      );

      // Extract expiry timestamp or use 0 if not found
      const expiryTimestamp = entityData
        ? Number(entityData.exp.toString())
        : 0;

      // Check if credential is still valid (not expired)
      const currentTime = Math.floor(Date.now() / 1000);
      const hasValid = expiryTimestamp > 0 && expiryTimestamp > currentTime;

      return { expiryTimestamp, hasValid };
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Account does not exist") ||
          error.message.includes("has no data"))
      ) {
        // No credential found, return false without throwing
        return { expiryTimestamp: 0, hasValid: false };
      } else {
        // Re-throw other errors to be handled by useQuery
        throw error;
      }
    }
  };

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchCredentialStatus,
    enabled: isEnabled,
    retry: false,
    refetchOnWindowFocus: false,
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  const hasValidCredential = useMemo(() => {
    if (!data) return false;
    const { expiryTimestamp } = data;
    const currentTime = Math.floor(Date.now() / 1000);
    return expiryTimestamp > 0 && currentTime < expiryTimestamp;
  }, [data]);

  const status = useMemo(() => {
    if (isPending) return "loading";
    if (isError) return "error";
    if (!isEnabled || !data) return "no-credential";

    const { expiryTimestamp } = data;
    const currentTime = Math.floor(Date.now() / 1000);

    if (expiryTimestamp > 0 && currentTime > expiryTimestamp) {
      return "expired";
    } else if (expiryTimestamp > 0 && currentTime < expiryTimestamp) {
      return "valid";
    } else {
      return "no-credential";
    }
  }, [isEnabled, data, isPending, isError]);

  const refetchAndReset = useCallback(async () => {
    // Flush data, as a pragmatic way to reset the UI into a loading state
    await queryClient.resetQueries({ queryKey });
    return refetch();
  }, [queryKey, refetch, queryClient]);

  return {
    hasValidCredential,
    status,
    error,
    refetch: refetchAndReset,
  };
};
