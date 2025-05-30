import { useCredentialUpdateEvm } from "./useCredentialUpdateEvm";
import { useCredentialUpdateSolana } from "./useCredentialUpdateSolana";
import { CredentialData } from "@keyringnetwork/keyring-connect-sdk";
import { useAppKitNetwork } from "@reown/appkit/react";

interface CredentialUpdateProps {
  calldata: CredentialData;
  onTransactionPending: () => void;
}

export const useCredentialUpdate = ({
  calldata,
  onTransactionPending,
}: CredentialUpdateProps) => {
  const { caipNetworkId } = useAppKitNetwork();

  const {
    writeWithWallet: writeWithEvmWallet,
    isWalletUpdating: isEvmWalletUpdating,
    simulationError: evmSimulationError,
    //triggerRetry: triggerEvmRetry,
    isSimulating: isEvmSimulating,
  } = useCredentialUpdateEvm({
    calldata,
    onTransactionPending,
    enabled: !!caipNetworkId?.startsWith("eip155"),
  });
  const {
    writeWithWallet: writeWithSolanaWallet,
    isWalletUpdating: isSolanaWalletUpdating,
    simulationError: solanaSimulationError,
    //triggerRetry: triggerSolanaRetry,
    isSimulating: isSolanaSimulating,
  } = useCredentialUpdateSolana({
    credentialData: calldata,
    onTransactionPending,
  });

  const isSolanaConnected = caipNetworkId?.startsWith("solana");

  // FIXME: Improve the refetch, such that only the relevant query is refetched
  // const triggerRetry = useCallback(() => {
  //   if (isSolanaConnected) {
  //     triggerSolanaRetry();
  //   } else {
  //     triggerEvmRetry();
  //   }
  // }, [isSolanaConnected, triggerSolanaRetry, triggerEvmRetry]);

  return {
    writeWithWallet: isSolanaConnected
      ? writeWithSolanaWallet
      : writeWithEvmWallet,
    isWalletUpdating: isSolanaConnected
      ? isSolanaWalletUpdating
      : isEvmWalletUpdating,
    simulationError: isSolanaConnected
      ? solanaSimulationError
      : evmSimulationError,
    //triggerRetry,
    isSimulating: isSolanaConnected ? isSolanaSimulating : isEvmSimulating,
  };
};
