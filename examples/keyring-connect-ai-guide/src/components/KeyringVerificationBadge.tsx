"use client";

import { Loader } from "lucide-react";
import Image from "next/image";
import type { KeyringCredentialStatus } from "@/lib/keyring-types";
import { cn } from "@/lib/keyring-utils";

export interface KeyringVerificationBadgeProps {
  status: KeyringCredentialStatus | "loading";
}

const badgeConfig = {
  "keyring:none": {
    bg: "bg-white",
    border: "border-keyring-border",
    text: "text-keyring-heading",
    label: "Verification Required",
    showIcon: true,
  },
  "keyring:valid": {
    bg: "bg-keyring-bg-valid",
    border: "border-keyring-border-valid",
    text: "text-keyring-text-valid",
    label: "Access Granted",
    showIcon: true,
  },
  "keyring:expired": {
    bg: "bg-keyring-bg-badge-expired",
    border: "border-keyring-border-expired",
    text: "text-keyring-heading",
    label: "Access Expired",
    showIcon: true,
  },
  loading: {
    bg: "bg-white",
    border: "border-keyring-border",
    text: "text-keyring-muted",
    label: "Checking...",
    showIcon: false,
  },
} as const;

export function KeyringVerificationBadge({
  status,
}: KeyringVerificationBadgeProps) {
  const stateKey = status === "loading" ? "loading" : status.state;
  const config = badgeConfig[stateKey];

  return (
    <div className="group relative inline-flex">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-1.5",
          config.bg,
          config.border
        )}
      >
        {stateKey === "loading" ? (
          <Loader className="h-3 w-3 animate-spin text-keyring-dark-alt" />
        ) : config.showIcon ? (
          <Image
            src="/images/keyring/keyring-icon.jpg"
            alt="Keyring"
            width={20}
            height={20}
            className="rounded-[10px]"
          />
        ) : null}
        <span className={cn("text-sm font-medium", config.text)}>
          {config.label}
        </span>
      </div>
      <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-keyring-dark px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        Access to this feature is permissioned on-chain by Keyring Network.
      </div>
    </div>
  );
}
