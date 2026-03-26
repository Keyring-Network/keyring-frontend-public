"use client";

import { Loader, ShieldAlert } from "lucide-react";
import { KeyringVerificationBadge } from "@/components/KeyringVerificationBadge";
import { cn } from "@/lib/keyring-utils";

export type ModuleCStep =
  | "supply"
  | "gate"
  | "install"
  | "verify"
  | "progress"
  | "verified"
  | "expired";

export interface KeyringConnectModuleCProps {
  step: ModuleCStep;
  onAction: () => void;
  onCancel?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ApyBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1.5 text-[13px] font-semibold text-green-800">
      6.0% APY
    </span>
  );
}

function Stepper({ activeStep }: { activeStep: 1 | 2 }) {
  return (
    <div className="flex w-full items-center gap-0 px-1 py-3">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
            activeStep === 1
              ? "bg-keyring-dark text-white"
              : "bg-keyring-border text-keyring-muted-light"
          )}
        >
          1
        </span>
        <span
          className={cn(
            "text-[13px] font-semibold",
            activeStep === 1 ? "text-keyring-heading" : "text-keyring-muted-light"
          )}
        >
          Verify
        </span>
      </div>
      {/* Line */}
      <div className="mx-2 h-px flex-1 bg-gray-300" />
      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
            activeStep === 2
              ? "bg-keyring-dark text-white"
              : "bg-keyring-border text-keyring-muted-light"
          )}
        >
          2
        </span>
        <span
          className={cn(
            "text-[13px]",
            activeStep === 2
              ? "font-semibold text-keyring-heading"
              : "font-medium text-keyring-muted-light"
          )}
        >
          Deposit USDC
        </span>
      </div>
    </div>
  );
}

function DepositForm({ faded }: { faded?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-5", faded && "opacity-30")}>
      {/* Divider */}
      <div className="h-px bg-keyring-border" />
      {/* You supply */}
      <span className="text-sm text-keyring-muted">You supply</span>
      {/* Input row */}
      <div className="flex h-16 items-center justify-between rounded-xl bg-keyring-bg-light px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2775ca] text-lg font-bold text-white">
            $
          </span>
          <span className="text-base font-semibold text-keyring-heading">
            USDC
          </span>
        </div>
        <span className="text-[28px] font-bold text-keyring-heading">100</span>
      </div>
      {/* Wallet row */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-keyring-muted">
          Wallet: 100,000
        </span>
        <div className="flex gap-2">
          <button className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-keyring-muted">
            Half
          </button>
          <button className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-keyring-muted">
            Max
          </button>
        </div>
      </div>
      {/* Min supply */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-keyring-muted">Min supply</span>
        <span className="text-[13px] font-semibold text-keyring-heading">
          10 USDC
        </span>
      </div>
    </div>
  );
}

function VerificationNotice() {
  return (
    <div className="flex gap-3 rounded-[10px] border border-yellow-300 bg-amber-50 p-4">
      <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-600" />
      <p className="text-[13px] font-medium text-amber-900">
        This vault requires identity verification via Keyring. Complete a quick
        verification to continue.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function KeyringConnectModuleC({
  step,
  onAction,
  onCancel,
}: KeyringConnectModuleCProps) {
  const isDepositView = step === "supply" || step === "verified" || step === "expired";
  const isVerificationView = step === "install" || step === "verify" || step === "progress";
  const isGate = step === "gate";

  const badgeStatus =
    step === "verified"
      ? ({ state: "keyring:valid", expiresAt: new Date() } as const)
      : step === "expired"
        ? ({ state: "keyring:expired", expiredAt: new Date() } as const)
        : ({ state: "keyring:none" } as const);

  const ctaConfig: Record<ModuleCStep, { label: string; disabled: boolean }> = {
    supply: { label: "Supply USDC", disabled: false },
    gate: { label: "Start Verification", disabled: false },
    install: { label: "Install Extension", disabled: false },
    verify: { label: "Verify with Keyring", disabled: false },
    progress: { label: "Verification In Progress...", disabled: true },
    verified: { label: "Supply USDC", disabled: false },
    expired: { label: "Supply USDC", disabled: false },
  };

  const helperTexts: Partial<Record<ModuleCStep, string>> = {
    install:
      "Install the Keyring Chrome extension to start the verification process.",
    verify:
      "Open the Keyring Chrome extension and follow the prompts to verify your identity.",
    progress:
      "Complete the verification in the Keyring extension. This page will update automatically.",
  };

  const cta = ctaConfig[step];

  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-keyring-border bg-white p-6 pt-7">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-keyring-heading">
            {isVerificationView ? "Identity Verification" : "Deposit USDC"}
          </h2>
          {!isVerificationView && <ApyBadge />}
        </div>

        {/* Status badge (deposit views) OR Stepper (verification views + gate) */}
        {isDepositView && <KeyringVerificationBadge status={badgeStatus} />}
        {(isGate || isVerificationView) && <Stepper activeStep={1} />}

        {/* Deposit form — full in deposit views, faded in gate, hidden in verification */}
        {(isDepositView || isGate) && <DepositForm faded={isGate} />}

        {/* Verification notice (gate only) */}
        {isGate && <VerificationNotice />}

        {/* Helper text (verification steps only) */}
        {helperTexts[step] && (
          <p className="text-center text-xs text-keyring-muted">
            {helperTexts[step]}
          </p>
        )}

        {/* CTA button */}
        <button
          onClick={cta.disabled ? undefined : onAction}
          disabled={cta.disabled}
          className={cn(
            "flex h-14 w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold transition-colors",
            cta.disabled
              ? "cursor-not-allowed bg-keyring-bg-light text-keyring-muted-light"
              : "bg-keyring-dark text-white hover:bg-keyring-dark/90"
          )}
        >
          {step === "progress" && (
            <Loader className="h-[18px] w-[18px] animate-spin" />
          )}
          {cta.label}
        </button>

        {/* Cancel button (gate + progress) */}
        {(isGate || step === "progress") && onCancel && (
          <button
            onClick={onCancel}
            className="flex h-10 w-full items-center justify-center text-sm font-medium text-keyring-muted hover:text-keyring-heading"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
