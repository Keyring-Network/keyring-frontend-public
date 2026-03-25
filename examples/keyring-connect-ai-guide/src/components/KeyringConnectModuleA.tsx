"use client";

import { LayoutGrid, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/keyring-utils";

export interface KeyringConnectModuleAProps {
  step: "install" | "start" | "progress" | "calldata-ready" | "refresh";
  onAction: () => void;
  onCancel?: () => void;
  isSimulating?: boolean;
  featureName?: string;
}

interface StepConfig {
  icon: "grid" | "user" | "user-spinner" | "shield";
  title: string;
  description: (featureName: string) => string;
  buttonLabel: string;
  buttonStyle: "primary" | "ghost";
  showCancel?: boolean;
  showBanner?: boolean;
}

const stepConfigs: Record<KeyringConnectModuleAProps["step"], StepConfig> = {
  install: {
    icon: "grid",
    title: "Verification Required",
    description: () =>
      "Install the Keyring extension to complete identity verification.",
    buttonLabel: "Install Extension",
    buttonStyle: "primary",
  },
  start: {
    icon: "user",
    title: "Verification Required",
    description: (featureName) =>
      `Verify your identity to access ${featureName}.`,
    buttonLabel: "Start Verification",
    buttonStyle: "primary",
  },
  progress: {
    icon: "user-spinner",
    title: "Verification In Progress",
    description: () => "After the verification you can continue here.",
    buttonLabel: "",
    buttonStyle: "ghost",
    showCancel: true,
  },
  "calldata-ready": {
    icon: "shield",
    title: "Credential Update",
    description: () => "Transaction ready to create the on-chain credential",
    buttonLabel: "Update credential",
    buttonStyle: "primary",
    showBanner: true,
  },
  refresh: {
    icon: "user",
    title: "Credential Renewal Required",
    description: (featureName) =>
      `Renew your credential to access ${featureName}.`,
    buttonLabel: "Refresh Credential",
    buttonStyle: "primary",
  },
};

function StepIcon({ type }: { type: StepConfig["icon"] }) {
  const icons = {
    grid: LayoutGrid,
    user: User,
    "user-spinner": User,
    shield: ShieldCheck,
  };
  const Icon = icons[type];

  return (
    <div className="relative flex-shrink-0">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-keyring-bg-light">
        <Icon className="h-5 w-5 text-keyring-muted" />
      </div>
      {type === "user-spinner" && (
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-keyring-dark-alt" />
      )}
    </div>
  );
}

export function KeyringConnectModuleA({
  step,
  onAction,
  onCancel,
  isSimulating = false,
  featureName = "[feature name]",
}: KeyringConnectModuleAProps) {
  const config = stepConfigs[step];

  return (
    <div className="flex w-full max-w-[460px] flex-col gap-3">
      <div className="rounded-lg border border-keyring-border bg-white p-6">
        <div className="flex flex-col gap-4">
          {/* Content row */}
          <div className="flex gap-4">
            <StepIcon type={config.icon} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <h3 className="text-base font-medium text-keyring-heading">
                {config.title}
              </h3>
              <p className="text-sm text-keyring-body">
                {config.description(featureName)}
              </p>
              {config.buttonStyle === "primary" && config.buttonLabel && (
                <button
                  onClick={onAction}
                  disabled={isSimulating}
                  className={cn(
                    "mt-1 inline-flex w-fit items-center justify-center rounded-lg bg-keyring-dark px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-keyring-dark/90",
                    isSimulating && "cursor-not-allowed opacity-60"
                  )}
                >
                  {isSimulating ? "Simulating..." : config.buttonLabel}
                </button>
              )}
            </div>
          </div>

          {/* Cancel row for progress step */}
          {config.showCancel && (
            <div className="flex justify-end">
              <button
                onClick={onCancel}
                className="text-sm font-medium text-keyring-muted hover:text-keyring-heading"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Divider + footer */}
          <div className="border-t border-keyring-bg-light" />
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-keyring-muted">Provided by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/keyring/keyring-logo-dark.svg"
              alt="Keyring"
              className="h-2.5 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Banner below card */}
      {config.showBanner && (
        <div className="flex items-center justify-center rounded-lg bg-keyring-bg-light px-4 py-3">
          <span className="text-sm text-keyring-muted-light">
            Complete Verification to continue
          </span>
        </div>
      )}
    </div>
  );
}
