const headers = { "Cache-Control": "no-store" };

function reply(body: unknown, status: number) {
  return Response.json(body, { status, headers });
}

/** The browser supplies the policy and nonce; credentials stay on the server. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ detail: "Expected a JSON policy_id and nonce." }, 400);
  }
  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    !("policy_id" in body) || typeof body.policy_id !== "number" ||
    !Number.isSafeInteger(body.policy_id) || body.policy_id <= 0 ||
    !("nonce" in body) || typeof body.nonce !== "string" || !/^[a-f0-9]{64}$/.test(body.nonce)
  ) {
    return reply({ detail: "A valid policy_id and nonce are required." }, 400);
  }

  const apiKey = process.env.KEYRING_DATA_SHARING_API_KEY;
  const base = process.env.NEXT_PUBLIC_KEYRING_API_BASE_URL?.trim();
  if (!apiKey?.trim() || !base) {
    return reply({ detail: "Proof-data sharing is not configured." }, 503);
  }
  const upstreamUrl = `${base.replace(/\/+$/, "")}/api/v1/policies/${body.policy_id}/proof-data/query`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ nonce: body.nonce }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) {
      const status = upstream.status === 404 ? 404 : upstream.status === 429 ? 429 : 502;
      return reply({ detail: status === 404 ? "No proof found for this nonce." : "Proof-data lookup is unavailable." }, status);
    }
    const result = await upstream.json();
    if (!Array.isArray(result?.results) || result.results.length !== 1) {
      return reply({ detail: "Unexpected proof-data response." }, 502);
    }
    return reply(result, 200);
  } catch {
    return reply({ detail: "Could not reach the proof-data service." }, 502);
  }
}
