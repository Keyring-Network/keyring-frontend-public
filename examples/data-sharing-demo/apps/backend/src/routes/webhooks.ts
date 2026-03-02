/**
 * Webhook handler for Keyring Data Sharing
 * Receives verified data from Keyring backend
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { sessionStore } from "../services/sessionStore";

const router: Router = Router();

/**
 * Verify HMAC-SHA256 signature from Keyring
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return signature === `sha256=${expected}`;
}

/**
 * POST /webhooks/keyring
 * Receive webhook from Keyring
 */
router.post("/keyring", (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-keyring-signature"] as string;
    const secret = process.env.KEYRING_WEBHOOK_SECRET;

    if (!secret) {
      console.error("KEYRING_WEBHOOK_SECRET not configured");
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    if (!verifyWebhookSignature(payload, signature, secret)) {
      console.error("Invalid webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Extract data
    const { event_id, session_id, timestamp, result, proof_metadata } =
      req.body;

    console.log(`📨 Webhook received: ${event_id} for session ${session_id}`);

    // Store the session data
    sessionStore.storeSession(session_id, {
      sessionId: session_id,
      verifiedData: result,
      proofMetadata: proof_metadata,
      receivedAt: new Date().toISOString(),
      webhookEventId: event_id,
      webhookTimestamp: timestamp,
    });

    // Respond with success
    res.status(200).json({
      received: true,
      event_id,
      session_id,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

export { router as webhookRouter };
