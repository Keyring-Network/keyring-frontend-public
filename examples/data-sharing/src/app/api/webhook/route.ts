import { alreadyHandled, record, WebhookEvent } from "@/lib/store";
import { verifySignature } from "@/lib/verify";
import { NextRequest, NextResponse } from "next/server";

/**
 * Where Keyring delivers verified data.
 *
 * The status codes matter: Keyring retries a 429 or a 5xx and gives up on anything else, so
 * a bad signature answers 400 rather than making it retry four more times against a secret
 * that will not start working.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.KEYRING_WEBHOOK_SECRET;
  if (!secret) {
    console.error("KEYRING_WEBHOOK_SECRET is not set");
    return NextResponse.json({ detail: "Not configured" }, { status: 500 });
  }

  // The raw bytes, before anything parses them. This is what was signed.
  const rawBody = await request.text();
  const signature = request.headers.get("x-keyring-signature");

  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ detail: "Invalid signature" }, { status: 400 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    // Signed but unreadable. Retrying will not make it parse, so do not ask for one.
    return NextResponse.json({ detail: "Malformed body" }, { status: 400 });
  }

  if (alreadyHandled(event.event_id)) {
    return NextResponse.json({ duplicate: true });
  }

  record(event);
  console.log(
    `Received ${Object.keys(event.verified_data).length} verified field(s) ` +
      `for ${event.user_context.external_user_id}`,
  );

  return NextResponse.json({ received: true });
}
