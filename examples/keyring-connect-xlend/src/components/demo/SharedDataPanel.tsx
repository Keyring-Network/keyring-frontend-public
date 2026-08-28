"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

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
  policyId,
  address,
}: {
  policyId: number;
  address?: string;
}) {
  const [state, setState] = useState<PanelState>({ kind: "idle" });
  // Held in memory only, forwarded per request, never persisted.
  const [apiKey, setApiKey] = useState("");

  // Rows belong to one key, one wallet and one policy; a switch empties the panel.
  useEffect(() => setState({ kind: "idle" }), [address, policyId, apiKey]);

  const getUserData = async () => {
    if (!address || !apiKey) {
      setState({ kind: "idle" });
      return;
    }

    try {
      setState({ kind: "loading" });
      const response = await fetch(
        `/api/proof-data?policy_id=${policyId}&wallet_address=${address}`,
        { headers: { "x-api-key": apiKey } },
      );

      const body = await response.json();
      if (!response.ok) {
        return setState({
          kind: "error",
          detail: body?.detail ?? `Request failed (${response.status})`,
        });
      }

      const rows: ProofRow[] = body?.results ?? [];
      setState(rows.length ? { kind: "ready", rows } : { kind: "empty" });
    } catch (error) {
      setState({ kind: "error", detail: "Could not reach the server." });
      console.error(error);
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
              What the policy owner receives over the proof-data API, for the
              connected wallet. Your key is forwarded to Keyring and not
              stored.
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Keyring API key"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                autoComplete="off"
              />
              <Button
                onClick={getUserData}
                disabled={state.kind === "loading" || !apiKey || !address}
              >
                Get user data
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
