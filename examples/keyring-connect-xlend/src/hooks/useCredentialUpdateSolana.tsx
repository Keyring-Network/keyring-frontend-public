import { SystemProgram, Transaction } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import {
  credentialUpdatePayload,
  getEntityMapping,
  getKeyMapping,
  getProgramState,
  getSolanaProgram,
} from "../lib/solana";
import { useAppKitProvider } from "@reown/appkit/react";
import {
  Provider,
  useAppKitConnection,
} from "@reown/appkit-adapter-solana/react";
import { CredentialData } from "@keyringnetwork/keyring-connect-sdk";
import { useCheckCredential } from "./useCheckCredential";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { createBlockExplorerAction } from "@/utils/blockExplorer";
import { useWaitForTransactionSolana } from "./useWaitForTransactionSolana";
import { useEnvironmentStore } from "./store/useEnvironmentStore";

interface CredentialUpdateProps {
  credentialData: CredentialData;
  onTransactionPending: () => void;
}

export const useCredentialUpdateSolana = ({
  credentialData,
  onTransactionPending,
}: CredentialUpdateProps) => {
  const { connection } = useAppKitConnection();
  const [isWalletUpdateSuccessful, setIsWalletUpdateSuccessful] =
    useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isWriteEnabled, setIsWriteEnabled] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [preparedTransaction, setPreparedTransaction] =
    useState<Transaction | null>(null);
  const [pendingToastId, setPendingToastId] = useState<string | number | null>(
    null
  );
  const { refetch: refetchCredential } = useCheckCredential(
    credentialData.policyId
  );
  const { environment } = useEnvironmentStore();
  const [retryCounter, setRetryCounter] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState<
    string | undefined
  >(undefined);
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  // Use the new hook to wait for transaction confirmation
  const {
    data: transactionStatus,
    isError: isTransactionError,
    error: transactionError,
  } = useWaitForTransactionSolana(transactionSignature);

  // Handle transaction status changes
  useEffect(() => {
    if (!transactionStatus) return;

    if (pendingToastId) {
      toast.dismiss(pendingToastId);
      setPendingToastId(null);
    }

    // Only process successful transactions once
    if (
      (transactionStatus.status === "confirmed" ||
        transactionStatus.status === "finalized") &&
      !isWalletUpdateSuccessful
    ) {
      // Set this flag first to prevent multiple executions
      setIsWalletUpdateSuccessful(true);

      toast.success("Transaction successful", {
        style: {
          backgroundColor: "white",
        },
        duration: Infinity,
        action: transactionSignature
          ? createBlockExplorerAction(
              transactionSignature,
              credentialData.chainId
            )
          : undefined,
      });

      // Fetch the updated credential
      refetchCredential();
      setIsBusy(false);

      // Clear the transaction signature to prevent re-running this effect
      setTransactionSignature(undefined);
    }
  }, [
    transactionStatus,
    isWalletUpdateSuccessful,
    credentialData,
    refetchCredential,
    pendingToastId,
    transactionSignature,
  ]);

  // Handle transaction errors
  useEffect(() => {
    if (isTransactionError && transactionError) {
      if (pendingToastId) {
        toast.dismiss(pendingToastId);
        setPendingToastId(null);
      }

      toast.error("Transaction failed", {
        style: {
          backgroundColor: "white",
        },
      });

      setIsBusy(false);
    }
  }, [isTransactionError, transactionError, pendingToastId]);

  // Prepare the transaction when credential data changes
  useEffect(() => {
    const prepareTransaction = async () => {
      if (
        !credentialData ||
        !walletProvider ||
        !walletProvider.publicKey ||
        !connection
      ) {
        setPreparedTransaction(null);
        return;
      }

      setIsSimulating(true); // Set simulating to true when starting

      try {
        const trader = walletProvider.publicKey;

        const program = getSolanaProgram({
          connection,
          env: environment,
        });

        // Get PDAs
        const programState = getProgramState(program);
        const entityMapping = getEntityMapping(
          credentialData.policyId,
          trader,
          program
        );
        const keyMapping = await getKeyMapping(
          credentialData.key,
          program,
          connection
        );

        // Create payload for credential update
        const payload = await credentialUpdatePayload(
          credentialData,
          trader,
          connection,
          environment
        );

        const transaction = await program.methods
          .createCredential(...payload)
          .accountsStrict({
            programState,
            signer: trader,
            keyMapping,
            entityMapping,
            systemProgram: SystemProgram.programId,
          })
          .transaction();

        transaction.feePayer = trader;

        // Get latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash(
          "finalized"
        );
        transaction.recentBlockhash = latestBlockhash.blockhash;

        // Simulate the transaction
        const simulation = await connection.simulateTransaction(transaction);

        // Check if simulation failed
        if (simulation.value.err) {
          const errorString = JSON.stringify(simulation.value.err);
          if (
            errorString.includes("AccountNotFound") ||
            simulation.value.logs?.some(
              (log: string) => log.includes("insufficient lamports") // TODO: we could add the actual amount of lamports needed
            )
          ) {
            setSimulationError(
              `Insufficient funds: Your Solana wallet needs SOL to perform this transaction`
            );
          } else {
            setSimulationError(`Simulation failed: ${errorString}`);
          }
          setPreparedTransaction(null);
          return;
        }

        // If simulation succeeds, store the transaction
        setPreparedTransaction(transaction);
        setSimulationError(null);
        setIsSimulating(false);
      } catch (error) {
        setSimulationError(
          `Preparation failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setPreparedTransaction(null);
        setIsSimulating(false);
      }
    };

    prepareTransaction();
  }, [credentialData, walletProvider, retryCounter, connection]);

  // Check if we can enable the write function
  useEffect(() => {
    setIsWriteEnabled(!!preparedTransaction && !simulationError);
  }, [preparedTransaction, simulationError]);

  const handleWrite = useCallback(async () => {
    if (!preparedTransaction || !connection) {
      return;
    }

    // Reset success state when starting a new transaction
    setIsWalletUpdateSuccessful(false);
    setIsBusy(true);

    try {
      // Use the prepared transaction
      const signature = await walletProvider.sendTransaction(
        preparedTransaction,
        connection
      );
      setTransactionSignature(signature);
      onTransactionPending();

      const toastId = toast("Transaction pending", {
        style: {
          backgroundColor: "white",
        },
        icon: <Loader className="h-3 w-3 animate-spin" />,
        duration: Infinity,
        action: createBlockExplorerAction(signature, credentialData.chainId),
      });
      setPendingToastId(toastId);
    } catch (error) {
      setIsBusy(false);

      if (error instanceof Error && error.message.includes("User rejected")) {
        return;
      }

      toast.error("Transaction failed", {
        style: {
          backgroundColor: "white",
        },
      });
    }
  }, [
    preparedTransaction,
    connection,
    walletProvider,
    onTransactionPending,
    credentialData,
  ]);

  const refetchSimulation = useCallback(() => {
    setRetryCounter((prev) => prev + 1);
    setSimulationError(null);
    setIsSimulating(true);
  }, []);

  return {
    writeWithWallet: isWriteEnabled ? handleWrite : undefined,
    isWalletUpdating: isBusy,
    isWalletUpdateSuccessful,
    simulationError,
    refetchSimulation,
    isSimulating,
  };
};
