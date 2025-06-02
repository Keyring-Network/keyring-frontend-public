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
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

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

  // Update flow if user has no valid credential
  useEffect(() => {
    if (flowState !== "no-credential") return;

    const updateFlowState = async () => {
      const installed = await KeyringConnect.isKeyringConnectInstalled();
      if (!installed) {
        setFlowState("install");
      } else {
        const { credentialData } =
          (await KeyringConnect.getExtensionState()) || {};
        if (credentialData && validCredentialData(credentialData)) {
          setCalldata(credentialData);
          setFlowState("calldata-ready");
        } else {
          setCalldata(null);
          setFlowState("start");
        }
      }
    };

    updateFlowState();
  }, [
    flowState,
    setFlowState,
    address,
    policyId,
    chainId,
    validCredentialData,
  ]);

  // Subscribe to the extension state changes
  useEffect(() => {
    if (flowState !== "no-credential") return;

    const unsubscribe = KeyringConnect.subscribeToExtensionState((state) => {
      if (!state) {
        setFlowState("install");
        return;
      }

      const { credentialData } = state;

      if (credentialData && validCredentialData(credentialData)) {
        setFlowState("calldata-ready");
        setCalldata(credentialData);
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

  // Keep a simple check status function for manual checks
  const checkStatus = useCallback(async () => {
    if (isCheckingStatus) return;
    setIsCheckingStatus(true);

    try {
      await KeyringConnect.getExtensionState();
      // Subscription will handle the state updates
    } catch (error) {
      console.error("Failed to check status:", error);
    } finally {
      setTimeout(() => {
        setIsCheckingStatus(false);
      }, 1500);
    }
  }, [isCheckingStatus]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset calldata when the account changes
  // Could also work with a map of address -> calldata to avoid too strict garbage collection
  useEffect(() => {
    if (address && chainId) {
      setCalldata(null);
    }
  }, [address, chainId]);

  if (!isMounted || !flowState) return null;

  const renderKeyringConnectModule = () => {
    if (
      flowState === "loading" ||
      flowState === "error" ||
      flowState === "valid"
    ) {
      return;
    }

    return (
      <div className="flex flex-col gap-4 p-6 border rounded-lg animate-slideDown bg-white border-gray-200">
        <div className="flex items-start gap-4">
          <Icon flowState={flowState} />

          <div className="flex-1">
            {flowState === "install" && (
              <>
                <h3 className="font-medium text-gray-900">
                  Verification Required
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Install the Keyring extension to complete identity
                  verification.
                </p>
                <Button className="mt-3" onClick={launchExtension}>
                  Install Extension
                </Button>
              </>
            )}

            {flowState === "start" && (
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
                  {credentialExpired
                    ? "Refresh Credential"
                    : "Start Verification"}
                </Button>
              </>
            )}

            {flowState === "progress" && (
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
                <div className="flex gap-2 justify-between mt-3">
                  <Button
                    onClick={checkStatus}
                    disabled={isCheckingStatus}
                    variant="outline"
                  >
                    {isCheckingStatus ? "Checking..." : "Check Status"}
                  </Button>
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
            )}

            {(flowState === "calldata-ready" ||
              flowState === "transaction-pending") &&
              calldata && (
                <>
                  <h3 className="font-medium text-gray-900">
                    {credentialExpired
                      ? "Credential Refresh"
                      : "Credential Update"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {credentialExpired
                      ? "Transaction ready to renew the on-chain credential"
                      : "Transaction ready to create the on-chain credential"}
                  </p>
                  <CredentialUpdate
                    calldata={calldata}
                    onTransactionPending={() =>
                      setFlowState("transaction-pending")
                    }
                  />
                </>
              )}
          </div>
        </div>
        <div className="bg-gray-100 h-px w-full mt-2" />
        <div className="w-full flex justify-center items-center gap-2">
          <p className="text-xs">Provided by </p>
          <KeyringLogo dark height={12} />
        </div>
      </div>
    );
  };

  return renderKeyringConnectModule();
}
