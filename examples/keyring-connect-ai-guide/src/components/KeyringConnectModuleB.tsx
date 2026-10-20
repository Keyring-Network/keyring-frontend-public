"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/keyring-utils";

export interface KeyringConnectModuleBProps {
  step: "install" | "verify" | "check-status" | "add-credential";
  onAction: () => void;
  onCancel?: () => void;
}

const ctaLabels: Record<KeyringConnectModuleBProps["step"], string> = {
  install: "Install Keyring Extension",
  verify: "Verify with Keyring",
  "check-status": "Check Verification Status",
  "add-credential": "Add Credential",
};

export function KeyringConnectModuleB({
  step,
  onAction,
  onCancel,
}: KeyringConnectModuleBProps) {
  return (
    <div className="flex w-full max-w-[460px] flex-col gap-6">
      {/* Info card */}
      <div className="rounded-lg border border-keyring-border bg-white p-6">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-keyring-bg-light">
            <Lock className="h-5 w-5 text-keyring-muted" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-medium text-keyring-heading">
              Permissioned Vault: Auth Required
            </h3>
            <p className="text-sm text-keyring-body">
              To access this vault, you&apos;ll need to verify using Keyring.
              Chrome browser required.
            </p>
          </div>
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={onAction}
        className="flex h-14 w-full items-center justify-center rounded-lg bg-keyring-dark text-sm font-medium text-white transition-colors hover:bg-keyring-dark/90"
      >
        {ctaLabels[step]}
      </button>

      {/* Cancel button for check-status step */}
      {step === "check-status" && onCancel && (
        <button
          onClick={onCancel}
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-lg bg-keyring-bg-light text-sm font-medium text-keyring-muted transition-colors hover:bg-keyring-border"
          )}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
