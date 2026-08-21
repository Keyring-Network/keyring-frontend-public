"use client";

import { useState } from "react";
import Link from "next/link";
import {
  KeyringConnectModuleC,
  type ModuleCStep,
} from "@/components/KeyringConnectModuleC";
import { cn } from "@/lib/keyring-utils";

const stepOptions: { value: ModuleCStep; label: string }[] = [
  { value: "supply", label: "0. Supply" },
  { value: "gate", label: "Gate" },
  { value: "install", label: "1. Install" },
  { value: "verify", label: "2. Verify" },
  { value: "progress", label: "3. In Progress" },
  { value: "verified", label: "4. Verified" },
  { value: "expired", label: "0. Expired" },
];

export default function VariantCPage() {
  const [step, setStep] = useState<ModuleCStep>("supply");

  return (
    <main className="min-h-screen bg-keyring-bg-page">
      <div className="mx-auto max-w-3xl px-8 py-12">
        {/* Header */}
        <div className="mb-12 rounded-2xl bg-keyring-dark px-10 py-8">
          <h1 className="text-2xl font-bold text-white">
            Variant C: Custom Integration Example
          </h1>
          <p className="mt-2 text-sm text-keyring-muted-light">
            A deposit card that embeds the verification flow in-context. The
            card transforms in place as the user progresses through a numbered
            stepper.
          </p>
        </div>

        {/* State panel */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-keyring-heading">
              In-Context Deposit Card
            </h2>
            <Link
              href="/"
              className="text-sm font-medium text-keyring-muted hover:text-keyring-heading"
            >
              &larr; Back to all components
            </Link>
          </div>
          <p className="mb-4 text-sm text-keyring-muted">
            Cycle through each step to see how the card adapts.
          </p>
          <div className="flex flex-wrap gap-1.5 rounded-lg bg-keyring-bg-light p-1.5">
            {stepOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStep(opt.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  step === opt.value
                    ? "bg-white text-keyring-heading shadow-sm"
                    : "text-keyring-muted hover:text-keyring-heading"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Component */}
        <div className="flex justify-center rounded-lg bg-white p-10">
          <KeyringConnectModuleC
            step={step}
            onAction={() => {}}
            onCancel={() => {}}
          />
        </div>

        {/* Flow diagram */}
        <div className="mt-8 rounded-lg border border-keyring-border bg-white p-5">
          <h3 className="mb-3 text-sm font-bold text-keyring-heading">
            Conditional Flow
          </h3>
          <div className="flex flex-col gap-2">
            {[
              {
                tag: "No extension",
                tagColor: "bg-amber-100 text-amber-800",
                flow: "0 \u2192 gate \u2192 1 \u2192 2 \u2192 3 \u2192 4",
              },
              {
                tag: "Extension installed",
                tagColor: "bg-blue-100 text-blue-800",
                flow: "0 \u2192 gate \u2192 3 \u2192 4",
              },
              {
                tag: "Already verified",
                tagColor: "bg-green-100 text-green-800",
                flow: "Step 4 — verified state persists across refreshes",
              },
              {
                tag: "Credential expired",
                tagColor: "bg-gray-100 text-gray-700",
                flow: "0 (expired badge) \u2192 gate \u2192 3 \u2192 4",
              },
            ].map((row) => (
              <div key={row.tag} className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-semibold",
                    row.tagColor
                  )}
                >
                  {row.tag}
                </span>
                <span className="text-xs font-medium tracking-wide text-gray-700">
                  {row.flow}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
