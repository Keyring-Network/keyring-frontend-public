"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Loader, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DATA_SHARING_DOCS_URL } from "@/config";
import { usePolicyStore } from "@/hooks/store/usePolicyStore";
import type { ProofData } from "@/lib/proofData";
import { cn } from "@/lib/utils";

interface ProofRow {
  entity_id: string;
  wallet_address: string | null;
  datasource_id: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

type PanelState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "error"; detail: string }
  | { kind: "ready"; rows: ProofRow[] };

const shortenNonce = (nonce: string) =>
  `${nonce.slice(0, 8)}...${nonce.slice(-6)}`;

const timeAgo = (iso: string): string => {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 45) return "just now";
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (seconds < 3600) return format.format(-Math.round(seconds / 60), "minute");
  if (seconds < 86400) return format.format(-Math.round(seconds / 3600), "hour");
  return format.format(-Math.round(seconds / 86400), "day");
};

/** The API serializes every field as a string, so "True"/"False" arrive as text. */
const asBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string" && /^(true|false)$/i.test(value)) {
    return value.toLowerCase() === "true";
  }
  return null;
};

const renderValue = (value: unknown) => {
  const flag = asBoolean(value);
  if (flag === null) return String(value);
  return (
    <span className="inline-flex items-center gap-1">
      {flag ? (
        <Check className="h-3.5 w-3.5 text-green-600" aria-hidden />
      ) : (
        <X className="h-3.5 w-3.5 text-red-500" aria-hidden />
      )}
      {String(value)}
    </span>
  );
};

/**
 * Developer-facing preview of what the policy owner can read back through the
 * proof-data API. Kept secondary to the lending flow: a one-line strip that
 * expands on demand.
 */
export function SharedDataPanel({
  proofData,
}: {
  proofData: ProofData | null;
}) {
  const { policy } = usePolicyStore();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PanelState>({ kind: "idle" });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const fetchProofData = async () => {
    if (!proofData) return;

    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    try {
      setState({ kind: "loading" });
      const response = await fetch("/api/proof-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_id: proofData.policyId,
          nonce: proofData.nonce,
        }),
        cache: "no-store",
        signal: request.signal,
      });

      const body = await response.json();
      if (request.signal.aborted) return;
      if (!response.ok) {
        return setState({
          kind: "error",
          detail: body?.detail ?? `Request failed (${response.status})`,
        });
      }

      const rows: ProofRow[] = body?.results ?? [];
      setState(rows.length ? { kind: "ready", rows } : { kind: "empty" });
    } catch {
      if (request.signal.aborted) return;
      setState({ kind: "error", detail: "Could not reach the server." });
    }
  };

  const copyNonce = async () => {
    if (!proofData) return;
    try {
      await navigator.clipboard.writeText(proofData.nonce);
      toast("Proof receipt copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const summary = (() => {
    switch (state.kind) {
      case "loading":
        return "Fetching...";
      case "ready":
        return `${state.rows.length} record${state.rows.length === 1 ? "" : "s"} readable by xLend`;
      case "empty":
        return "No records for this receipt";
      case "error":
        return "Fetch failed";
      default:
        return proofData
          ? "Proof receipt ready to fetch"
          : `Enabled for ${policy.name}`;
    }
  })();

  const indicator =
    state.kind === "error"
      ? "bg-red-500"
      : proofData
        ? "bg-teal"
        : "bg-gray-300";

  const renderResult = () => {
    switch (state.kind) {
      case "ready":
        return (
          <ul className="space-y-3">
            {state.rows.map((row) => (
              <li
                key={`${row.entity_id}-${row.created_at}`}
                className="rounded-md border border-gray-200 bg-white p-3"
              >
                <div className="mb-2 flex justify-between gap-4 text-xs text-gray-500">
                  <span className="font-mono">{row.datasource_id}</span>
                  <time
                    dateTime={row.created_at}
                    title={new Date(row.created_at).toLocaleString()}
                  >
                    {timeAgo(row.created_at)}
                  </time>
                </div>
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                  {Object.entries(row.data ?? {}).map(([field, value]) => (
                    <Fragment key={field}>
                      <dt className="font-mono text-xs leading-5 text-gray-500">
                        {field}
                      </dt>
                      <dd className="break-all text-right font-medium text-gray-900">
                        {renderValue(value)}
                      </dd>
                    </Fragment>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        );
      case "empty":
        return (
          <p className="text-xs text-gray-500">
            No proof data was found for this receipt.
          </p>
        );
      case "error":
        return <p className="text-xs text-red-500">{state.detail}</p>;
      default:
        return null;
    }
  };

  return (
    <section
      aria-label="Data sharing preview"
      className="mt-3 rounded-lg border border-blue-200/70 bg-white/60 text-firefly"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 text-xs">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="shared-data-details"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            aria-hidden
            className={cn("h-2 w-2 shrink-0 rounded-full", indicator)}
          />
          <span className="shrink-0 font-medium">Data sharing</span>
          <span className="truncate text-gray-600">{summary}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "ml-auto h-4 w-4 shrink-0 text-gray-500 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        <span aria-hidden className="h-4 w-px bg-blue-200/70" />
        <a
          href={DATA_SHARING_DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 text-gray-600 hover:text-firefly"
        >
          Docs
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>

      {open && (
        <div
          id="shared-data-details"
          className="space-y-4 border-t border-blue-100 px-4 py-4"
        >
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              What the policy owner receives
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              After a verification, xLend&apos;s backend can read the verified
              fields for this proof with its policy API key. Only the fields the
              policy uses are stored. Evaluation feature, enabled only for{" "}
              {policy.name}.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-gray-600">
              <span className="shrink-0">Proof receipt</span>
              {proofData ? (
                <>
                  <code
                    title={proofData.nonce}
                    className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-800"
                  >
                    {shortenNonce(proofData.nonce)}
                  </code>
                  <button
                    type="button"
                    onClick={copyNonce}
                    aria-label="Copy proof receipt"
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-firefly"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </>
              ) : (
                <span className="italic">none yet, complete a verification</span>
              )}
            </div>
            <Button
              size="sm"
              onClick={fetchProofData}
              disabled={!proofData || state.kind === "loading"}
            >
              Retrieve shared data
              {state.kind === "loading" && <Loader className="animate-spin" />}
            </Button>
          </div>

          {renderResult()}
        </div>
      )}
    </section>
  );
}
