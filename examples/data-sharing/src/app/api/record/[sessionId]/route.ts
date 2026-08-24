import { getRecord } from "@/lib/keyring";
import { asResponse } from "@/lib/respond";
import { findBySession } from "@/lib/store";
import { NextResponse } from "next/server";

/**
 * What we know about one request, values included.
 *
 * The webhook is the path that matters, so a delivered copy wins. Reading the record is the
 * fallback for when one has not arrived — an unreachable URL, or a delivery still retrying —
 * so the demo shows the data either way rather than a blank page.
 *
 * `source` says which happened, because the difference is the whole point.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const delivered = findBySession(sessionId);
  if (delivered) {
    return NextResponse.json({
      source: "webhook",
      external_user_id: delivered.user_context.external_user_id,
      verified_data: delivered.verified_data,
      unavailable_fields: delivered.unavailable_fields,
      datasource_id: delivered.datasource.id,
    });
  }

  try {
    const record = await getRecord(sessionId);
    return NextResponse.json({
      source: "record",
      external_user_id: record.external_user_id,
      verified_data: record.verified_data,
      unavailable_fields: record.unavailable_fields,
      datasource_id: record.proof_metadata.datasource_id ?? null,
    });
  } catch (error) {
    return asResponse(error);
  }
}
