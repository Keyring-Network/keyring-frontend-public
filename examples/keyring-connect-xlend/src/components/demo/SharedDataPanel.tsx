"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import type { ProofData } from "@/lib/proofData";

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

export function SharedDataPanel({
  proofData,
}: {
  proofData: ProofData | null;
}) {
  const [state, setState] = useState<PanelState>({ kind: "idle" });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const getUserData = async () => {
    if (!proofData) {
      setState({ kind: "idle" });
      return;
    }

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

  const render = () => {
    switch (state.kind) {
      case "ready":
        return (
          <>
            <div className="space-y-3">
              {state.rows.map((row) => (
                <div
                  key={`${row.entity_id}-${row.created_at}`}
                  className="rounded border border-gray-200 p-3"
                >
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>{row.datasource_id}</span>
                    <span>{new Date(row.created_at).toLocaleString()}</span>
                  </div>
                  <dl className="text-sm">
                    {Object.entries(row.data ?? {}).map(([field, value]) => (
                      <div key={field} className="flex justify-between gap-4">
                        <dt className="text-gray-500">{field}</dt>
                        <dd className="font-medium break-all">
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </>
        );

      case "empty":
        return (
          <p className="text-sm text-gray-400">
            No proof data was found for this verification.
          </p>
        );

      case "error":
        return <p className="text-sm text-red-500">{state.detail}</p>;

      default:
        break;
    }
  };

  return (
    <div>
      <Card className="bg-white rounded-xl shadow-lg overflow-idle mt-4">
        <CardContent className="px-4">
          <div className="mb-3">
            <h3 className="font-medium text-gray-900">
              Shared with this policy&apos;s owner
            </h3>
            <p className="text-sm text-gray-600 mt-1 mb-3">
              Data from this verification, retrieved securely by xLend.
              {!proofData && " Start a verification here to make its proof data available."}
            </p>
            {proofData && (
              <p className="text-xs text-gray-600 mb-3">
                Lookup nonce: <code className="break-all">{proofData.nonce}</code>
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={getUserData}
                disabled={state.kind === "loading" || !proofData}
              >
                Get verification data
                {state.kind === "loading" && (
                  <Loader className="ml-2 animate-spin" />
                )}
              </Button>
            </div>
          </div>

          {render()}
        </CardContent>
      </Card>
    </div>
  );
}
