import { useCredentialUpdateEvm } from "./useCredentialUpdateEvm";
import { useCredentialUpdateSolana } from "./useCredentialUpdateSolana";
import { CredentialData } from "@keyringnetwork/keyring-connect-sdk";
import { useAppKitNetwork } from "@reown/appkit/react";
import { getSimulationErrorMessage } from "@/utils/simulationError";

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
    refetchSimulation: refetchEvmSimulation,
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
    refetchSimulation: refetchSolanaSimulation,
    isSimulating: isSolanaSimulating,
  } = useCredentialUpdateSolana({
    credentialData: calldata,
    onTransactionPending,
  });

  const isSolanaConnected = caipNetworkId?.startsWith("solana");
  const simulationError = isSolanaConnected
    ? solanaSimulationError
    : evmSimulationError;

  return {
    writeWithWallet: isSolanaConnected
      ? writeWithSolanaWallet
      : writeWithEvmWallet,
    isWalletUpdating: isSolanaConnected
      ? isSolanaWalletUpdating
      : isEvmWalletUpdating,
    simulationError: simulationError
      ? getSimulationErrorMessage(simulationError)
      : null,
    simulationErrorDetails:
      simulationError instanceof Error
        ? simulationError.message
        : simulationError,
    refetchSimulation: isSolanaConnected
      ? refetchSolanaSimulation
      : refetchEvmSimulation,
    isSimulating: isSolanaConnected ? isSolanaSimulating : isEvmSimulating,
  };
};
