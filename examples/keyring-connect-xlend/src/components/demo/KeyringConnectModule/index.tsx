"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  KeyringConnect,
  ExtensionSDKConfig,
  CredentialData,
} from "@keyringnetwork/keyring-connect-sdk";
import { Icon } from "./Icon";
import { FlowState } from "@/app/page";
import { KeyringLogo } from "@/components/ui/keyring-logo";
import { CredentialUpdate } from "./CredentialUpdate";
import { KrnSupportedChainId } from "@keyringnetwork/contracts-abi";
import { CaipNetworkId } from "@reown/appkit";
import { getChainIdFromCaipNetworkId } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
interface KeyringConnectModuleProps {
  policyId: number;
  address?: string;
  caipNetworkId?: CaipNetworkId;
  flowState: FlowState | null;
  credentialExpired: boolean;
  setFlowState: (flowState: FlowState) => void;
}

/**
 * The `KeyringConnectModule` component showcases how the Keyring Connect verification process can be implemented.
 *
 * @param {number} policyId - The policy ID to be used for the Keyring Connect verification process.
 */
export function KeyringConnectModule({
  policyId,
  address,
  caipNetworkId,
  flowState,
  credentialExpired,
  setFlowState,
}: KeyringConnectModuleProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [calldata, setCalldata] = useState<CredentialData | null>(null);

  const chainId = useMemo(() => {
    return getChainIdFromCaipNetworkId(caipNetworkId);
  }, [caipNetworkId]);

  const validCredentialData = useCallback(
    (credentialData: CredentialData): boolean => {
      return (
        credentialData.trader === address &&
        credentialData.policyId === policyId &&
        credentialData.chainId === chainId
      );
    },
    [address, policyId, chainId]
  );

  // Subscribe to the extension state changes
  useEffect(() => {
    const unsubscribe = KeyringConnect.subscribeToExtensionState((state) => {
      if (!state) {
        setFlowState("install");
        return;
      }

      const { credentialData } = state;

      if (credentialData && validCredentialData(credentialData)) {
        setFlowState("calldata-ready");
        setCalldata(credentialData);
      } else if (flowState !== "progress") {
        setCalldata(null);
        setFlowState("start");
      }
    });

    return unsubscribe; // Cleanup on unmount

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validCredentialData, flowState]);

  // LAUNCH THE EXTENSION
  // NOTE: `KeyringConnect.launchExtension` takes internallycare of checking if the extension is installed.
  // If the extension is not installed, the user will be redirected to the extension's install page.
  // The user gets redirected back to the app after the extension is installed.
  // Hence it is NOT recommended to manually link to the extension's install page.
  // If the extension is installed, the extension will be launched and the user can start the Keyring Connect verification process.
  const launchExtension = async () => {
    if (!address || !chainId) return;

    try {
      const exampleConfig: ExtensionSDKConfig = {
        app_url: window.location.origin,
        name: "xLend",
        logo_url: `${window.location.origin}/xlend-icon.svg`,
        policy_id: policyId,
        credential_config: {
          chain_id: chainId as KrnSupportedChainId,
          wallet_address: address,
        },
        // NOTE: This `krn_config` is only required for development purposes and needs to be removed in production.
        krn_config: {
          keyring_api_url: "https://main.api.keyring-backend.krndev.net",
          keyring_user_app_url: "https://app.keyringdev.network",
        },
      };

      // Update state to show progress
      setFlowState("progress");
      setCalldata(null);

      await KeyringConnect.launchExtension(exampleConfig);
    } catch (error) {
      console.error("Failed to launch extension:", error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset calldata when the account or network changes
  useEffect(() => {
    if (address && chainId) {
      setCalldata(null);
    }
  }, [address, chainId]);

  if (!isMounted || !flowState) return null;

  const renderKeyringConnectModule = () => {
    switch (flowState) {
      case "install":
        return (
          <>
            <h3 className="font-medium text-gray-900">Verification Required</h3>
            <p className="text-sm text-gray-600 mt-1">
              Install the Keyring extension to complete identity verification.
            </p>
            <Button className="mt-3" onClick={launchExtension}>
              Install Extension
            </Button>
          </>
        );
      case "start":
        return (
          <>
            <h3 className="font-medium text-gray-900">
              {credentialExpired
                ? "Credential Renewal Required"
                : "Verification Required"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {credentialExpired
                ? "Renew your credential to access lending features."
                : "Verify your identity to access lending features."}
            </p>
            <Button className="mt-3" onClick={launchExtension}>
              {credentialExpired ? "Refresh Credential" : "Start Verification"}
            </Button>
          </>
        );
      case "progress":
        return (
          <>
            <h3 className="font-medium text-gray-900">
              {credentialExpired
                ? "Credential Renewal In Progress"
                : "Verification In Progress"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {credentialExpired
                ? "Transaction will be prepared in the Keyring extension."
                : "After the verification you can continue here."}
            </p>
            <div className="flex gap-2 justify-end mt-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setFlowState("start");
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        );
      case "calldata-ready":
      case "transaction-pending":
        return (
          calldata && (
            <>
              <h3 className="font-medium text-gray-900">
                {credentialExpired ? "Credential Refresh" : "Credential Update"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {credentialExpired
                  ? "Transaction ready to renew the on-chain credential"
                  : "Transaction ready to create the on-chain credential"}
              </p>
              <CredentialUpdate
                calldata={calldata}
                onTransactionPending={() => setFlowState("transaction-pending")}
              />
            </>
          )
        );
      case "no-credential":
      case "loading":
      default:
        return null;
    }
  };

  const shouldShowSkeleton =
    flowState === "no-credential" || flowState === "loading" || !flowState;

  return (
    <div className="flex flex-col gap-4 p-6 border rounded-lg animate-slideDown bg-white border-gray-200">
      {shouldShowSkeleton ? (
        <>
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

            <div className="flex-1 space-y-3">
              <Skeleton className="w-3/4 h-5 rounded-md" />
              <Skeleton className="w-full h-4 rounded-md" />
              <Skeleton className="w-2/3 h-4 rounded-md" />
              <Skeleton className="w-32 h-9 rounded-md" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start gap-4">
            <Icon flowState={flowState} />
            <div className="flex-1">{renderKeyringConnectModule()}</div>
          </div>

          <div className="bg-gray-100 h-px w-full mt-2" />
          <div className="w-full flex justify-center items-center gap-2">
            <p className="text-xs">Provided by </p>
            <KeyringLogo dark height={12} />
          </div>
        </>
      )}
    </div>
  );
}
