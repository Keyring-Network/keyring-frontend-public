"use client";

import { AppHeader } from "@/components/demo/XLendAppInterface/AppHeader";
import { LendingFormMock } from "@/components/demo/XLendAppInterface/LendingFormMock";
import { Card, CardContent } from "@/components/ui/card";
import { LendingTabsMock } from "@/components/demo/XLendAppInterface/LendingTabsMock";
import { CtaMock } from "@/components/demo/XLendAppInterface/CtaMock";
import { useEffect, useState } from "react";
import { useCheckCredential } from "@/hooks/useCheckCredential";
import { VerificationBadge } from "@/components/demo/KeyringConnectModule/VerificationBadge";
import { useAccount } from "wagmi";
import { KeyringConnectModule } from "@/components/demo/KeyringConnectModule";

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
  const { address, chainId } = useAccount();

  // NOTE: Must be set to the same policyId used on-chain, for now hardcoded to test policy
  const POLICY_ID = 7;

  const { status: credentialStatus, error } = useCheckCredential(POLICY_ID);

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
        setFlowState("no-credential");
        break;
    }
  }, [credentialStatus, address]);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          <VerificationBadge flowState={flowState} />

          <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
            <CardContent className="p-4 pb-0">
              <LendingTabsMock />
              <LendingFormMock activeTab="install" />

              <KeyringConnectModule
                policyId={POLICY_ID}
                flowState={flowState}
                setFlowState={setFlowState}
                address={address}
                chainId={chainId}
              />

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
    </div>
  );
}
