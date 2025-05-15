import { NextRequest, NextResponse } from "next/server";
import keyringClient from "@/services/keyring";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const onchainPolicyId = searchParams.get("onchainPolicyId");

  if (!userId || !onchainPolicyId) {
    return NextResponse.json(
      { error: "User ID and onchain policy ID are required" },
      { status: 400 }
    );
  }

  const userStatus = await keyringClient.getUserStatus(userId, onchainPolicyId);
  return NextResponse.json(userStatus);
}
