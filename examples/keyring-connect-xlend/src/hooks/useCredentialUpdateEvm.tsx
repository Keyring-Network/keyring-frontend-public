import { CredentialData } from "@keyringnetwork/keyring-connect-sdk";
import { useEffect, useState } from "react";
import {
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useCheckCredential } from "./useCheckCredential";
import { toast } from "sonner";
import {
  getKrnDeploymentArtifact,
  KrnSupportedChainId,
} from "@keyringnetwork/contracts-abi";
import { Loader } from "lucide-react";
import { createBlockExplorerAction } from "@/utils/blockExplorer";
import { DEPLOYMENT_ENVIRONMENT } from "@/config";
import { useAppKitNetwork } from "@reown/appkit/react";

interface CredentialUpdateProps {
  calldata: CredentialData;
  onTransactionPending: () => void;
  enabled: boolean;
}

interface CredentialUpdateResponse {
  writeWithWallet: (() => void) | undefined;
  isWalletUpdating: boolean;
  isSimulating: boolean;
  simulationError: string | null;
  refetchSimulation: () => void;
}

export const useCredentialUpdateEvm = ({
  calldata,
  onTransactionPending,
  enabled,
}: CredentialUpdateProps): CredentialUpdateResponse => {
  const [hash, setHash] = useState<`0x${string}`>();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [pendingToastId, setPendingToastId] = useState<string | number | null>(
    null
  );
  const { refetch: refetchCredential } = useCheckCredential(calldata.policyId);
  const { chainId } = useAppKitNetwork();

  const _chainId = (chainId || 1) as KrnSupportedChainId;

  const contract = enabled
    ? getKrnDeploymentArtifact({
        chainId: _chainId,
        env: DEPLOYMENT_ENVIRONMENT, // NOTE: only for development purposes, env should be removed in production
      })
    : {
        address: "",
        ABI: [],
      };

  const {
    data,
    error: simulateContractError,
    status: simulateContractStatus,
    refetch: refetchSimulation,
  } = useSimulateContract({
    functionName: "createCredential",
    abi: contract.ABI,
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
    address: contract.address as `0x${string}`,
  });

  const { writeContract, isPending: isPendingContractWrite } = useWriteContract(
    {
      mutation: {
        onSuccess(data) {
          setHash(data);
          onTransactionPending();
          const toastId = toast("Transaction pending", {
            style: {
              backgroundColor: "white",
            },
            icon: <Loader className="h-3 w-3 animate-spin" />,
            duration: Infinity,
            action: createBlockExplorerAction(data, _chainId),
          });
          setPendingToastId(toastId);
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
    if (simulateContractStatus === "pending") {
      setIsSimulating(true);
      setSimulationError(null);
    }

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

    if (pendingToastId) {
      toast.dismiss(pendingToastId);
      setPendingToastId(null);
    }

    if (transactionReceiptStatus === "success") {
      if (transactionReceipt?.status !== "reverted") {
        refetchCredential();
        toast.success("Transaction successful", {
          style: {
            backgroundColor: "white",
          },
          duration: Infinity,
          action: hash ? createBlockExplorerAction(hash, _chainId) : undefined,
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
      if (pendingToastId) {
        toast.dismiss(pendingToastId);
        setPendingToastId(null);
      }
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
    isWalletUpdating: isPending,
    isSimulating,
    refetchSimulation,
    simulationError,
  };
};
