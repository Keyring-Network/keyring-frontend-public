"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyringVerificationBadge } from "@/components/KeyringVerificationBadge";
import { KeyringConnectModuleA } from "@/components/KeyringConnectModuleA";
import { KeyringConnectModuleB } from "@/components/KeyringConnectModuleB";
import { KeyringGatedCTA } from "@/components/KeyringGatedCTA";
import type { KeyringCredentialStatus } from "@/lib/keyring-types";
import { cn } from "@/lib/keyring-utils";

function StatePanel<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg bg-keyring-bg-light p-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-white text-keyring-heading shadow-sm"
              : "text-keyring-muted hover:text-keyring-heading"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-keyring-heading">{title}</h2>
      <p className="mt-1 text-sm text-keyring-muted">{description}</p>
    </div>
  );
}

type BadgeState = "keyring:none" | "keyring:valid" | "keyring:expired" | "loading";

const badgeStatuses: Record<BadgeState, KeyringCredentialStatus | "loading"> = {
  "keyring:none": { state: "keyring:none" },
  "keyring:valid": { state: "keyring:valid", expiresAt: new Date(Date.now() + 86400000) },
  "keyring:expired": { state: "keyring:expired", expiredAt: new Date(Date.now() - 86400000) },
  loading: "loading",
};

const badgeOptions: { value: BadgeState; label: string }[] = [
  { value: "keyring:none", label: "No Credential" },
  { value: "keyring:valid", label: "Valid" },
  { value: "keyring:expired", label: "Expired" },
  { value: "loading", label: "Loading" },
];

const moduleAOptions: { value: "install" | "start" | "progress" | "calldata-ready" | "refresh"; label: string }[] = [
  { value: "install", label: "1. Install" },
  { value: "start", label: "2. Start" },
  { value: "progress", label: "3. In Progress" },
  { value: "calldata-ready", label: "4. Credential" },
  { value: "refresh", label: "5. Refresh" },
];

const moduleBOptions: { value: "install" | "verify" | "check-status" | "add-credential"; label: string }[] = [
  { value: "install", label: "1. Install" },
  { value: "verify", label: "2. Verify" },
  { value: "check-status", label: "3. Check Status" },
  { value: "add-credential", label: "4. Add Credential" },
];

const ctaOptions: { value: "not-connected" | "not-verified" | "verified"; label: string }[] = [
  { value: "not-connected", label: "Not Connected" },
  { value: "not-verified", label: "Not Verified" },
  { value: "verified", label: "Verified" },
];

export default function KeyringShowcase() {
  const [badgeState, setBadgeState] = useState<BadgeState>("keyring:none");
  const [moduleAStep, setModuleAStep] = useState<(typeof moduleAOptions)[number]["value"]>("install");
  const [moduleBStep, setModuleBStep] = useState<(typeof moduleBOptions)[number]["value"]>("install");
  const [ctaState, setCtaState] = useState<(typeof ctaOptions)[number]["value"]>("not-connected");

  const noop = () => {};

  return (
    <main className="min-h-screen bg-keyring-bg-page">
      <div className="mx-auto max-w-3xl px-8 py-12">
        {/* Page title */}
        <div className="mb-12 rounded-2xl bg-keyring-dark px-10 py-8">
          <h1 className="text-2xl font-bold text-white">
            Keyring Connect — UI Component Blueprint
          </h1>
          <p className="mt-2 text-sm text-keyring-muted-light">
            Two integration patterns for permissioning dApp actions behind
            on-chain KYC credentials.
          </p>
        </div>

        {/* Section 1: Verification Badge */}
        <section className="mb-12">
          <div className="flex flex-col gap-4">
            <SectionHeader
              title="Component 1: Verification Status Badge"
              description="Status badge showing the user's credential state."
            />
            <StatePanel options={badgeOptions} value={badgeState} onChange={setBadgeState} />
          </div>
          <div className="mt-6 flex items-center justify-center rounded-lg bg-white p-10">
            <KeyringVerificationBadge status={badgeStatuses[badgeState]} />
          </div>
        </section>

        {/* Section 2: Variant A */}
        <section className="mb-12">
          <div className="flex flex-col gap-4">
            <SectionHeader
              title="Variant A: Module Card Pattern"
              description="Keyring-branded module card that appears/disappears per step."
            />
            <StatePanel options={moduleAOptions} value={moduleAStep} onChange={setModuleAStep} />
          </div>
          <div className="mt-6 flex justify-center rounded-lg bg-white p-10">
            <KeyringConnectModuleA
              step={moduleAStep}
              onAction={noop}
              onCancel={noop}
              featureName="this vault"
            />
          </div>
        </section>

        {/* Section 3: Variant B */}
        <section className="mb-12">
          <div className="flex flex-col gap-4">
            <SectionHeader
              title="Variant B: CTA Cycling Pattern"
              description="Persistent info card with cycling CTA button text."
            />
            <StatePanel options={moduleBOptions} value={moduleBStep} onChange={setModuleBStep} />
          </div>
          <div className="mt-6 flex justify-center rounded-lg bg-white p-10">
            <KeyringConnectModuleB
              step={moduleBStep}
              onAction={noop}
              onCancel={noop}
            />
          </div>
        </section>

        {/* Section 4: Gated CTA */}
        <section className="mb-12">
          <div className="flex flex-col gap-4">
            <SectionHeader
              title="Component 3: Gated CTA Button"
              description="Full-width action button gated by wallet and verification state."
            />
            <StatePanel options={ctaOptions} value={ctaState} onChange={setCtaState} />
          </div>
          <div className="mt-6 flex justify-center rounded-lg bg-white p-10">
            <KeyringGatedCTA
              state={ctaState}
              actionLabel="[Your Action]"
              onClick={noop}
            />
          </div>
        </section>

        {/* Link to Variant C */}
        <section className="mb-12">
          <Link
            href="/variant-c"
            className="flex items-center justify-between rounded-lg border border-keyring-border bg-white px-6 py-5 transition-colors hover:bg-keyring-bg-light"
          >
            <div>
              <h2 className="text-lg font-bold text-keyring-heading">
                Variant C: Custom Integration Example
              </h2>
              <p className="mt-1 text-sm text-keyring-muted">
                A deposit card that embeds the verification flow in-context,
                transforming in place as the user progresses.
              </p>
            </div>
            <span className="text-keyring-muted">&rarr;</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
