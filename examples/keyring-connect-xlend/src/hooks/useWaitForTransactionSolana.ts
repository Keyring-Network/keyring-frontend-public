import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { useQuery } from "@tanstack/react-query";

type TransactionStatus = "pending" | "confirmed" | "finalized" | "failed";

interface WaitForTransactionOptions {
  confirmations?: number;
  pollingInterval?: number;
  timeout?: number;
  enabled?: boolean;
}

interface WaitForTransactionResult {
  status: TransactionStatus | null;
  confirmations?: number | null;
  error?: Error;
}

/**
 * Hook to wait for a Solana transaction to be confirmed
 */
export function useWaitForTransactionSolana(
  signature?: string,
  options: WaitForTransactionOptions = {}
) {
  const { connection } = useAppKitConnection();
  const {
    confirmations = 1,
    pollingInterval = 2000,
    enabled: enabledOption,
  } = options;

  const enabled = Boolean(signature && (enabledOption ?? true));

  return useQuery({
    queryKey: ["solana", "transaction", signature],
    queryFn: async (): Promise<WaitForTransactionResult> => {
      if (!signature || !connection) {
        throw new Error("Transaction signature and connection are required");
      }

      try {
        const statuses = await connection.getSignatureStatuses([signature]);
        const status = statuses.value[0];

        if (!status) {
          return { status: "pending" };
        }

        if (status.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
        }

        const txStatus = status.confirmationStatus as TransactionStatus;
        return {
          status: txStatus,
          confirmations: status.confirmations,
        };
      } catch (error) {
        const typedError =
          error instanceof Error ? error : new Error("Unknown error");
        // handleError(typedError, "SolanaTransactionStatusError");
        throw typedError;
      }
    },
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling when transaction is confirmed or finalized with enough confirmations
      if (data?.status === "confirmed" || data?.status === "finalized") {
        if (
          confirmations <= 1 ||
          (data.confirmations && data.confirmations >= confirmations)
        ) {
          return false;
        }
      }
      return pollingInterval;
    },
    refetchIntervalInBackground: true,
    retry: true,
    staleTime: 0,
    gcTime: 0,
  });
}
