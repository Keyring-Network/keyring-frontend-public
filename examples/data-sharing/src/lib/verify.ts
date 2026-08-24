import { createHmac, timingSafeEqual } from "node:crypto";

/** How much clock skew to tolerate. Matches the backend's default. */
const TOLERANCE_SECONDS = 300;

/**
 * Verify a webhook signature.
 *
 * `rawBody` must be the exact bytes that arrived. Re-serialising the parsed JSON produces a
 * different string whenever key order, whitespace or unicode escaping differ, and the
 * signature will not match.
 */
export const verifySignature = (
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean => {
  const parts = new Map(
    signatureHeader.split(",").map((part) => {
      const at = part.indexOf("=");
      return at === -1
        ? ["", ""]
        : [part.slice(0, at).trim(), part.slice(at + 1)];
    }),
  );

  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  if (Math.abs(Date.now() / 1000 - sentAt) > TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  if (expected.length !== signature.length) return false;

  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};
