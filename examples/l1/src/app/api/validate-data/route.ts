import keyringClient from "@/services/keyring";
import { ValidateDataRequest } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateDataRequest;
    const { userId, policyId, data } = body;

    if (!userId || !policyId || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validationResult = await keyringClient.validateData(body);
    return NextResponse.json(validationResult);
  } catch (error: unknown) {
    const errorResponse = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      {
        error:
          errorResponse.response?.data?.detail || "Failed to validate data",
      },
      { status: errorResponse.response?.status || 500 }
    );
  }
}
