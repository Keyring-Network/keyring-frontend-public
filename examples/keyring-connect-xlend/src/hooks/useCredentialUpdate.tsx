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
    refetchSimulation: isSolanaConnected
      ? refetchSolanaSimulation
      : refetchEvmSimulation,
    isSimulating: isSolanaConnected ? isSolanaSimulating : isEvmSimulating,
  };
};
