"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  KeyringConnect,
  ExtensionState,
  ExtensionSDKConfig,
  CredentialData,
  SupportedChainId,
} from "@keyringnetwork/keyring-connect-sdk";
import { Icon } from "./Icon";
import { useAccount } from "wagmi";
import { useWalletModalStore } from "@/hooks/store/useWalletModalStore";
import { useCheckCredential } from "@/hooks/useCheckCredential";

interface KeyringConnectModuleProps {
  policyId: number;
}

export type FlowState =
  | "loading"
  | "error"
  | "install"
  | "start"
  | "progress"
  | "calldata-ready"
  | "transaction"
  | "valid";

/**
 * The `KeyringConnectModule` component showcases how the Keyring Connect verification process can be implemented.
 *
 * @param {number} policyId - The policy ID to be used for the Keyring Connect verification process.
 */
export function KeyringConnectModule({ policyId }: KeyringConnectModuleProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [calldata, setCalldata] = useState<CredentialData | null>(null);
  const [extensionState, setExtensionState] = useState<ExtensionState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { open } = useWalletModalStore();

  // Unified state for the complete E2E flow
  const [flowState, setFlowState] = useState<FlowState>("loading");

  console.log("flowState", flowState);

  // Status check interval ID for cleanup
  const [statusCheckInterval, setStatusCheckInterval] =
    useState<NodeJS.Timeout | null>(null);

  const { status: credentialStatus, error: credentialError } =
    useCheckCredential(policyId);

  // Update flow state based on credential status
  useEffect(() => {
    const updateFlowState = async () => {
      switch (credentialStatus) {
        case "loading":
          setFlowState("loading");
          break;
        case "error":
          setFlowState("error");
          break;
        case "valid":
          setFlowState("valid");
          break;
        case "no-credential":
          // check if extension is installed and if attestation is ready
          const installed = await KeyringConnect.isKeyringConnectInstalled();
          if (!installed) {
            setFlowState("install");
          } else {
            setFlowState("start");
          }
          break;
      }
    };

    updateFlowState();
  }, [credentialStatus]);

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
          chain_id: chainId as SupportedChainId,
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

      // Start periodic status checks
      setTimeout(() => {
        startStatusChecks();
      }, 5000);
    } catch (error) {
      console.error("Failed to launch extension:", error);
    }
  };

  // Start periodic status checks
  const startStatusChecks = useCallback(() => {
    // Clear any existing interval
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }

    // Set up a new interval to check status every 3 seconds
    const intervalId = setInterval(checkStatus, 3000);
    setStatusCheckInterval(intervalId);

    // Initial check
    checkStatus();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // CHECK VERIFICATION STATUS
  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const state = await KeyringConnect.getExtensionState();
      setExtensionState(state);

      console.log("Extension state:", state);

      // Check if user exists and attestation is ready
      if (state.credentialData) {
        // Stop status checks
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }

        // Move to next flow state
        setFlowState("calldata-ready");
        setCalldata(state.credentialData);
      }

      // FIXME: Remove this after checking that we never have this state
      // If the user already has a valid credential from the extension
      if (state?.user?.credential_status === "valid") {
        // Stop status checks
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          setStatusCheckInterval(null);
        }

        setFlowState("valid");
      }
    } catch (error) {
      console.error("Failed to check status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual check status button handler
  const handleCheckStatus = () => {
    checkStatus();
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const createCredential = async () => {
    console.log("createCredential", { calldata });
  };

  // Reset calldata when the account changes
  // Could also work with a map of address -> calldata to avoid too strict garbage collection
  useEffect(() => {
    if (address && chainId) {
      setCalldata(null);
    }
  }, [address, chainId]);

  if (!isMounted) return null;

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        className="rounded-md w-full border-blue-500 text-blue-500 flex items-center h-14"
        onClick={open}
      >
        <p>Connect your wallet to continue</p>
      </Button>
    );
  }

  const renderKeyringConnectModule = () => {
    if (flowState === "loading") {
      return;
    }

    if (flowState === "error") {
      return <div>Error: {credentialError?.message}</div>;
    }

    return (
      <div
        className={`p-6 border rounded-lg animate-slideDown ${
          flowState === "valid"
            ? "bg-green-50 border-green-200 px-6 py-2"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <Icon flowState={flowState} />

          <div className="flex-1">
            {flowState === "install" && (
              <>
                <h3 className="font-medium text-gray-900">
                  Keyring Connect Verification Required
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Install the Keyring extension to complete identity
                  verification.
                </p>
                <Button
                  className="mt-3"
                  onClick={launchExtension}
                  disabled={isLoading}
                >
                  Install Extension
                </Button>
              </>
            )}

            {flowState === "start" && (
              <>
                <h3 className="font-medium text-gray-900">
                  Complete Keyring Connect Verification
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Verify your identity to access lending features.
                </p>
                <Button
                  className="mt-3"
                  onClick={launchExtension}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Start Verification
                </Button>
              </>
            )}

            {flowState === "progress" && (
              <>
                <h3 className="font-medium text-gray-900">
                  Keyring Connect Verification In Progress
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  After the verification is complete, you can continue here.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button onClick={handleCheckStatus} disabled={isLoading}>
                    {isLoading ? (
                      <Loader className="h-4 w-4 mr-2 animate-spin " />
                    ) : null}
                    Check Status
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (statusCheckInterval) {
                        clearInterval(statusCheckInterval);
                        setStatusCheckInterval(null);
                        // FIXME: Allow closing of the extension ???
                      }
                      setFlowState("start");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                {extensionState?.user ? (
                  <>
                    <div className="mt-2 text-xs text-gray-500">
                      Wallet Address: {extensionState.user.wallet_address}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Attestation Status:{" "}
                      {extensionState.user.attestation_status}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Credential Status:{" "}
                      {extensionState.user.credential_status || "none"}
                    </div>
                  </>
                ) : (
                  <div className="mt-2 text-xs text-gray-500">
                    Status: Waiting for user authentication...
                  </div>
                )}
              </>
            )}

            {flowState === "calldata-ready" && (
              <>
                <h3 className="font-medium text-gray-900">
                  Credential Update Transaction Ready
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sign the transaction to create the on-chain credential
                </p>
                <Button className="mt-3" onClick={createCredential}>
                  Create Credential
                </Button>
              </>
            )}

            {flowState === "transaction" && (
              <>
                <h3 className="font-medium text-gray-900">
                  Finalizing Verification
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your verification is being recorded on the blockchain.
                </p>
                <div className="flex items-center justify-center py-4">
                  <Loader className="h-8 w-8 animate-spin text-blue-500" />
                </div>
                <p className="text-xs text-gray-500">
                  Transaction in progress. This may take a few moments to
                  confirm...
                </p>
              </>
            )}

            {flowState === "valid" && (
              <>
                <p className="text-sm text-green-600 mt-0.5">
                  You have valid credentials.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderKeyringConnectModule()}
      <MainCtaButton
        isVerified={flowState === "valid"}
        isLoading={flowState === "loading"}
      />
    </>
  );
}

const MainCtaButton = ({
  isVerified,
  isLoading,
}: {
  isVerified: boolean;
  isLoading: boolean;
}) => {
  return (
    <Button
      className="w-full mt-6"
      disabled={!isVerified || isLoading}
      variant={isVerified ? "default" : "secondary"}
    >
      {isVerified
        ? "Lend"
        : isLoading
        ? "Loading credential status..."
        : "Complete Verification to continue"}
    </Button>
  );
};
