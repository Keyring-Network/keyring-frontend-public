import { getRecord } from "@/lib/keyring";
import { asResponse } from "@/lib/respond";
import { NextResponse } from "next/server";

/**
 * What we know about one request, values included.
 *
 * Read from Keyring with the API key, because this demo keeps nothing of its own. An
 * integration that stored the delivered webhook would answer from that instead, and reach
 * for this only when no delivery had arrived.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  try {
    const record = await getRecord(sessionId);
    return NextResponse.json({
      external_user_id: record.external_user_id,
      verified_data: record.verified_data,
      unavailable_fields: record.unavailable_fields,
      datasource_id: record.proof_metadata.datasource_id ?? null,
    });
  } catch (error) {
    return asResponse(error);
  }
}
