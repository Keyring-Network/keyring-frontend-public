import { getPartner } from "@/lib/keyring";
import { asResponse } from "@/lib/respond";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(await getPartner());
  } catch (error) {
    return asResponse(error);
  }
}
