import { NextRequest, NextResponse } from "next/server";

/**
 * Reads this policy's verified proof data from Keyring.
 *
 * Server-side only: the API key never reaches the browser. Unconfigured or refused
 * responses come back as-is so the panel can decide to stay hidden.
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.KEYRING_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ detail: "KEYRING_API_KEY is not set" }, { status: 501 });
  }

  const policyId = request.nextUrl.searchParams.get("policy_id");
  if (!policyId) {
    return NextResponse.json({ detail: "policy_id is required" }, { status: 400 });
  }

  const wallet = request.nextUrl.searchParams.get("wallet_address");
  const query = wallet ? `?wallet_address=${encodeURIComponent(wallet)}` : "";

  const base =
    process.env.KEYRING_API_BASE_URL ??
    process.env.NEXT_PUBLIC_KEYRING_API_BASE_URL ??
    "http://localhost:8000";

  const upstream = await fetch(`${base}/api/v1/policies/${policyId}/proof-data${query}`, {
    headers: { "X-API-Key": apiKey },
    cache: "no-store",
  });

  return NextResponse.json(await upstream.json(), { status: upstream.status });
}
