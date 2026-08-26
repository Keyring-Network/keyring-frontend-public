"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "../ui/button";
import { Loader } from "lucide-react";

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
  | { kind: "ready"; rows: ProofRow[] };

export function SharedDataPanel({
  policyId,
  address,
  verified,
}: {
  policyId: number;
  address?: string;
  verified: boolean;
}) {
  const [state, setState] = useState<PanelState>({ kind: "idle" });

  const getUserData = async () => {
    if (!address) {
      setState({ kind: "idle" });
      return;
    }

    try {
      setState({ kind: "loading" });
      const response = await fetch(
        `/api/proof-data?policy_id=${policyId}&wallet_address=${address}`,
      );

      if (!response.ok) return setState({ kind: "idle" });

      const body = await response.json();
      const rows: ProofRow[] = body?.results ?? [];

      setState(rows.length ? { kind: "ready", rows } : { kind: "empty" });
    } catch (error) {
      setState({ kind: "idle" });
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
            Nothing shared for this wallet yet. Complete a verification and it
            appears here.
          </p>
        );

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
              Verified fields for your wallet, delivered over the proof-data
              API.
            </p>
            <Button onClick={getUserData} disabled={state.kind === "loading"}>
              Get user data
              {state.kind === "loading" && (
                <Loader className="ml-2 animate-spin" />
              )}
            </Button>
          </div>

          {render()}
        </CardContent>
      </Card>
    </div>
  );
}
