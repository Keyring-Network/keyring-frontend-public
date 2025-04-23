import keyringClient from "@/services/keyring";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, proof, publicSignals, policyId } = body;

    if (!userId || !proof || !publicSignals || !policyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await keyringClient.getBlindedSignature(userId, policyId, {
      proof,
      public_signals: publicSignals,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorResponse = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      {
        error:
          errorResponse.response?.data?.detail ||
          "Failed to get blinded signature",
      },
      { status: errorResponse.response?.status || 500 }
    );
  }
}
