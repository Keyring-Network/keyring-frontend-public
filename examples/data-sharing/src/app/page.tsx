"use client";

import type { PartnerConfig } from "@/lib/keyring";
import {
  KeyringConnect,
  type DataSharingResult,
  type DataSharingStatus,
} from "@keyringnetwork/keyring-connect-sdk";
import { useEffect, useState } from "react";

const PROGRESS: Record<DataSharingStatus, string> = {
  launching: "Opening Keyring Connect…",
  loading_plan: "Loading the request…",
  awaiting_consent: "Waiting for you to review the request",
  selecting_source: "Waiting for you to choose an account",
  proving: "Proving — sign in to your account in the tab that opened",
  completed: "Done",
  declined: "Declined",
  failed: "Failed",
  expired: "Expired",
};

const toggle = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];

export default function Home() {
  const [partner, setPartner] = useState<PartnerConfig | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [purpose, setPurpose] = useState(
    "Confirm your account meets our eligibility requirements",
  );

  const [status, setStatus] = useState<DataSharingStatus | null>(null);
  const [outcome, setOutcome] = useState<DataSharingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // What this partner may ask for is server-held configuration, not something the page
  // decides. Everything on offer here came from Keyring.
  useEffect(() => {
    fetch("/api/partner")
      .then((response) => response.json())
      .then((config: PartnerConfig) => {
        setPartner(config);
        setFields(config.allowed_fields.map((field) => field.field_id));
        setSources(config.allowed_datasources.map((source) => source.id));
      })
      .catch(() => setError("Could not load the partner configuration"));
  }, []);

  const share = async () => {
    setError(null);
    setOutcome(null);
    setStatus("launching");

    try {
      // The session is created by our own backend, which holds the API key. The page only
      // ever sees the session and its token.
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_fields: fields,
          datasource_ids: sources,
          purpose,
        }),
      });

      const session = await response.json();
      if (!response.ok) throw new Error(session.detail ?? "Could not start");

      setOutcome(
        await KeyringConnect.launchDataSharing({
          session_id: session.session_id,
          session_token: session.session_token,
          expires_at: session.expires_at,
          krn_config: session.krn_config,
          onStatusChange: setStatus,
        }),
      );
    } catch (thrown) {
      setStatus(null);
      setError(thrown instanceof Error ? thrown.message : "Something went wrong");
    }
  };

  const running = status !== null && outcome === null;
  const canShare = fields.length > 0 && sources.length > 0 && !running;

  if (!partner) {
    return <p className="text-sm text-slate-500">{error ?? "Loading…"}</p>;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{partner.display_name}</h1>
        <p className="text-sm text-slate-500">
          Share verified data from an account you already have. Nothing leaves your
          browser except the fields you agree to.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          What to ask for
        </h2>
        {partner.allowed_fields.map((field) => (
          <label
            key={field.field_id}
            className="flex gap-3 rounded border border-slate-200 bg-white p-3"
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={fields.includes(field.field_id)}
              onChange={() => setFields(toggle(fields, field.field_id))}
              disabled={running}
            />
            <span>
              <span className="block text-sm">{field.label}</span>
              <span className="block text-xs text-slate-500">
                {field.description}
              </span>
            </span>
          </label>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Where it may come from
        </h2>
        <div className="flex flex-wrap gap-2">
          {partner.allowed_datasources.map((source) => (
            <label
              key={source.id}
              className={`flex items-center gap-2 rounded border p-2 text-sm ${
                sources.includes(source.id)
                  ? "border-slate-900 bg-white"
                  : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              <input
                type="checkbox"
                checked={sources.includes(source.id)}
                onChange={() => setSources(toggle(sources, source.id))}
                disabled={running}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source.image} alt="" className="size-5 rounded" />
              {source.name}
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Offer more than one and the user chooses which account to prove from.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Why you are asking
        </h2>
        <input
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          disabled={running}
          className="w-full rounded border border-slate-200 p-2 text-sm"
        />
        <p className="text-xs text-slate-500">
          Shown on the consent screen, attributed to you.
        </p>
      </section>

      <button
        onClick={share}
        disabled={!canShare}
        className="w-full rounded bg-slate-900 p-3 text-sm text-white disabled:opacity-40"
      >
        Share my data
      </button>

      {status && !outcome && (
        <p className="text-sm text-slate-600">{PROGRESS[status]}</p>
      )}

      {outcome && (
        <p className="text-sm" data-testid={`outcome-${outcome.status}`}>
          {outcome.status}
          {outcome.errorCode ? ` — ${outcome.errorCode}` : ""}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
