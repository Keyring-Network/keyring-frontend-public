"use client";

import { AppHeader } from "@/components/demo/XLendAppInterface/AppHeader";
import { LendingFormMock } from "@/components/demo/XLendAppInterface/LendingFormMock";
import { Card, CardContent } from "@/components/ui/card";
import { LendingTabsMock } from "@/components/demo/XLendAppInterface/LendingTabsMock";
import { CtaMock } from "@/components/demo/XLendAppInterface/CtaMock";
import { useEffect, useState } from "react";
import { useCheckCredential } from "@/hooks/useCheckCredential";
import { VerificationBadge } from "@/components/demo/KeyringConnectModule/VerificationBadge";
import { KeyringConnectModule } from "@/components/demo/KeyringConnectModule";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { KeyringConnectLinks } from "@/components/demo/KeyringConnectModule/KeyringConnectLinks";
import { usePolicyStore } from "@/hooks/store/usePolicyStore";

export type FlowState =
  | "loading"
  | "error"
  | "no-credential"
  | "install"
  | "start"
  | "progress"
  | "calldata-ready"
  | "transaction-pending"
  | "valid";

export default function KeyringConnectDemo() {
  const [isMounted, setIsMounted] = useState(false);
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const { address } = useAppKitAccount();
  const { caipNetworkId } = useAppKitNetwork();
  const { policyId } = usePolicyStore();

  const { status: credentialStatus, error } = useCheckCredential(policyId);

  // Update flow state based on credential status
  useEffect(() => {
    if (!address) {
      setFlowState(null);
      return;
    }

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
      case "expired":
        setFlowState("no-credential");
        break;
    }
  }, [credentialStatus, address]);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only mount KeyringConnectModule when user interaction is needed for verification
  const shouldShowKeyringModule =
    !!address &&
    !!flowState &&
    [
      "no-credential",
      "install",
      "start",
      "progress",
      "calldata-ready",
      "transaction-pending",
    ].includes(flowState);

  // Only render client-side content after mounting
  if (!isMounted) {
    return (
      <div className="bg-blue-100/50 h-full">
        <AppHeader />
      </div>
    );
  }

  return (
    <div className="bg-blue-100/50 h-full">
      <AppHeader />
      <div className="flex justify-center items-center py-8 px-4">
        <div className="w-full max-w-xl">
          <VerificationBadge
            flowState={flowState}
            credentialExpired={credentialStatus === "expired"}
          />

          <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
            <CardContent className="p-4 pb-0">
              <LendingTabsMock />
              <LendingFormMock activeTab="install" />

              {shouldShowKeyringModule && (
                <KeyringConnectModule
                  policyId={policyId}
                  flowState={flowState}
                  setFlowState={setFlowState}
                  address={address}
                  caipNetworkId={caipNetworkId}
                  credentialExpired={credentialStatus === "expired"}
                />
              )}

              <CtaMock flowState={flowState} />

              {flowState === "error" && (
                <div className="p-4">
                  <p className="text-red-500">
                    Unexpected error: {error?.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <KeyringConnectLinks />
    </div>
  );
}
