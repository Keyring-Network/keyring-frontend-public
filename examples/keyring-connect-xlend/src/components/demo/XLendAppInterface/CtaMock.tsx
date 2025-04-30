"use client";

import { FlowState } from "@/app/page";
import { Button } from "@/components/ui/button";
import { useWalletModalStore } from "@/hooks/store/useWalletModalStore";
import { useAccount } from "wagmi";

interface CtaMockProps {
  flowState: FlowState | null;
}

export const CtaMock = ({ flowState }: CtaMockProps) => {
  const isVerified = flowState === "valid";
  const isLoading = flowState === "loading";

  const { isConnected } = useAccount();
  const { open } = useWalletModalStore();

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
