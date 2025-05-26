import { getKeyringContractAddress, KEYRING_CONTRACT_ABI } from "@/constant";
import { CredentialData } from "@keyringnetwork/keyring-connect-sdk";
import { useEffect, useState } from "react";
import {
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useCheckCredential } from "./useCheckCredential";
import { toast } from "sonner";

interface CredentialUpdateProps {
  calldata: CredentialData;
  onTransactionPending: () => void;
}

interface CredentialUpdateResponse {
  writeWithWallet: (() => void) | undefined;
  isPending: boolean;
  isSimulating: boolean;
  simulationError: string | null;
}

export const useCredentialUpdateEvm = ({
  calldata,
  onTransactionPending,
}: CredentialUpdateProps): CredentialUpdateResponse => {
  const [hash, setHash] = useState<`0x${string}`>();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const { refetch: refetchCredential } = useCheckCredential(calldata.policyId);

  const {
    data,
    error: simulateContractError,
    status: simulateContractStatus,
  } = useSimulateContract({
    functionName: "createCredential",
    abi: KEYRING_CONTRACT_ABI,
    value: BigInt(calldata.cost),
    args: [
      calldata.trader,
      calldata.policyId,
      calldata.chainId,
      calldata.validUntil,
      calldata.cost,
      calldata.key as `0x${string}`,
      calldata.signature as `0x${string}`,
      calldata.backdoor as `0x${string}`,
    ],
    address: getKeyringContractAddress(calldata.chainId) as `0x${string}`,
  });

  const { writeContract, isPending: isPendingContractWrite } = useWriteContract(
    {
      mutation: {
        onSuccess(data) {
          setHash(data);
          onTransactionPending();
          toast("Transaction pending", {
            style: {
              backgroundColor: "white",
            },
            duration: Infinity,
            action: {
              label: "Inspect",
              onClick: () => {
                window.open(`https://etherscan.io/tx/${data}`, "_blank");
              },
            },
          });
        },
      },
    }
  );

  const {
    data: transactionReceipt,
    status: transactionReceiptStatus,
    isFetching: isPendingTransactionReceipt,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: Boolean(hash),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  });

  const isWriteEnabled =
    !!data?.request && simulateContractStatus === "success";
  const isPending = isPendingContractWrite || isPendingTransactionReceipt;

  useEffect(() => {
    if (!calldata) return;

    setIsSimulating(true);
    setSimulationError(null);
  }, [calldata]);

  useEffect(() => {
    if (
      simulateContractStatus === "success" ||
      simulateContractStatus === "error"
    ) {
      setIsSimulating(false);
      if (simulateContractError) {
        setSimulationError(simulateContractError?.message || null);
        console.error(simulateContractError);
      }
    }
  }, [simulateContractStatus, simulateContractError]);

  // Transaction receipt handling
  useEffect(() => {
    if (!transactionReceipt) return;

    if (transactionReceiptStatus === "success") {
      if (transactionReceipt?.status !== "reverted") {
        refetchCredential();
        toast.success("Transaction successful", {
          style: {
            backgroundColor: "white",
          },
          duration: Infinity,
        });
      } else {
        toast.error("Transaction reverted", {
          style: {
            backgroundColor: "white",
          },
        });
      }
    }

    if (transactionReceiptStatus === "error") {
      toast.error("Transaction failed", {
        style: {
          backgroundColor: "white",
        },
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionReceiptStatus]);

  const handleWrite = () => {
    writeContract(data!.request);
  };

  return {
    writeWithWallet: isWriteEnabled ? handleWrite : undefined,
    isPending,
    isSimulating,
    simulationError,
  };
};
