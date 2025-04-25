import { NextRequest, NextResponse } from "next/server";
import keyringClient from "@/services/keyring";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const policyId = searchParams.get("policyId");

  if (!userId || !policyId) {
    return NextResponse.json(
      { error: "User ID and policy ID are required" },
      { status: 400 }
    );
  }

  const userStatus = await keyringClient.getUserStatus(userId, policyId);
  return NextResponse.json(userStatus);
}
