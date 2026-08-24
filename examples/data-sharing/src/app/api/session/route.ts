import { createSession } from "@/lib/keyring";
import { asResponse } from "@/lib/respond";
import { NextRequest, NextResponse } from "next/server";

/**
 * Stands in for the signed-in user. A real integration puts its own user id here, and reads
 * it back off the webhook to know which account the data belongs to.
 */
const DEMO_USER_ID = "demo-user-1";

export async function POST(request: NextRequest) {
  try {
    const { requested_fields, datasource_ids, purpose } = await request.json();

    const session = await createSession({
      requested_fields,
      datasource_ids,
      purpose,
      external_user_id: DEMO_USER_ID,
    });

    return NextResponse.json({
      ...session,
      external_user_id: DEMO_USER_ID,
      // Points the extension at the same backend we just created the session on. Without it
      // the extension would talk to production and find no such session.
      krn_config: { keyring_api_url: process.env.KEYRING_API_URL },
    });
  } catch (error) {
    return asResponse(error);
  }
}
