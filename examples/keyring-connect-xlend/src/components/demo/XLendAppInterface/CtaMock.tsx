"use client";

import { FlowState } from "@/app/page";
import { Button } from "@/components/ui/button";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

interface CtaMockProps {
  flowState: FlowState | null;
}

export const CtaMock = ({ flowState }: CtaMockProps) => {
  const isVerified = flowState === "valid";
  const isLoading = flowState === "loading";

  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        className="rounded-md w-full border-blue-500 text-blue-500 flex items-center h-14"
        onClick={() => open({ view: "Connect" })}
      >
        <p>Connect your wallet to continue</p>
      </Button>
    );
  }

  if (!flowState) return null;

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
