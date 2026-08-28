import { NextRequest, NextResponse } from "next/server";

/**
 * Reads a policy's verified proof data from Keyring with the caller's own API key.
 *
 * The key is the authorization: it is policy-scoped and provisioned by Keyring, so only
 * its holder can read anything. It arrives per request, is forwarded, and is never
 * stored or logged here.
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ detail: "X-API-Key header is required" }, { status: 401 });
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
