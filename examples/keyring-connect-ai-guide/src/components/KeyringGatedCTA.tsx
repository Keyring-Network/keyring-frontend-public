"use client";

import { cn } from "@/lib/keyring-utils";

export interface KeyringGatedCTAProps {
  state: "not-connected" | "not-verified" | "verified";
  actionLabel?: string;
  onClick?: () => void;
}

export function KeyringGatedCTA({
  state,
  actionLabel = "[Your Action]",
  onClick,
}: KeyringGatedCTAProps) {
  return (
    <button
      onClick={onClick}
      disabled={state === "not-verified"}
      className={cn(
        "flex h-14 w-full max-w-[460px] items-center justify-center rounded-lg text-[15px] font-medium transition-colors",
        state === "not-connected" &&
          "border-[1.5px] border-keyring-dark-alt text-keyring-dark-alt hover:bg-keyring-bg-light",
        state === "not-verified" &&
          "cursor-not-allowed bg-keyring-bg-light text-keyring-muted-light",
        state === "verified" &&
          "bg-keyring-dark text-white hover:bg-keyring-dark/90"
      )}
    >
      {state === "not-connected" && "Connect your wallet to continue"}
      {state === "not-verified" && "Complete Verification to continue"}
      {state === "verified" && actionLabel}
    </button>
  );
}
