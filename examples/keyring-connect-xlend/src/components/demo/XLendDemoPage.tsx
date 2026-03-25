"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { AppHeader } from "@/components/demo/XLendAppInterface/AppHeader";
import { LendingFormMock } from "@/components/demo/XLendAppInterface/LendingFormMock";
import { Card, CardContent } from "@/components/ui/card";
import { LendingTabsMock } from "@/components/demo/XLendAppInterface/LendingTabsMock";
import { CtaMock } from "@/components/demo/XLendAppInterface/CtaMock";
import { useCheckCredential } from "@/hooks/useCheckCredential";
import { VerificationBadge } from "@/components/demo/KeyringConnectModule/VerificationBadge";
import { KeyringConnectModule } from "@/components/demo/KeyringConnectModule";
import { KeyringConnectLinks } from "@/components/demo/KeyringConnectModule/KeyringConnectLinks";
import { usePolicyStore } from "@/hooks/store/usePolicyStore";
import { Button } from "@/components/ui/button";
import { DemoTransportMode, FlowState } from "./types";

interface XLendDemoPageProps {
  transportMode: DemoTransportMode;
  title: string;
  description: string;
}

export function XLendDemoPage({
  transportMode,
  title,
  description,
}: XLendDemoPageProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const { address } = useAppKitAccount();
  const { caipNetworkId } = useAppKitNetwork();
  const { policy } = usePolicyStore();

  const { status: credentialStatus, error } = useCheckCredential(
    policy.onchain_id,
  );

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shouldShowKeyringModule =
    !!address &&
    !!flowState &&
    [
      "no-credential",
      "progress",
      "calldata-ready",
      "transaction-pending",
    ].includes(flowState);

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
          <div className="mb-4 rounded-xl border border-blue-200 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  {transportMode === "sessionApi"
                    ? "Session API Demo"
                    : "Chrome API Demo"}
                </p>
                <h1 className="mt-1 text-lg font-semibold text-gray-900">
                  {title}
                </h1>
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant={
                    transportMode === "chromeApi" ? "default" : "outline"
                  }
                >
                  <Link href="/">Direct</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant={
                    transportMode === "sessionApi" ? "default" : "outline"
                  }
                >
                  <Link href="/session-api">Session</Link>
                </Button>
              </div>
            </div>
          </div>

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
                  policyId={policy.onchain_id}
                  flowState={flowState}
                  setFlowState={setFlowState}
                  address={address}
                  caipNetworkId={caipNetworkId}
                  credentialExpired={credentialStatus === "expired"}
                  transportMode={transportMode}
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
