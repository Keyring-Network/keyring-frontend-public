import keyringClient from "@/services/keyring";
import { NextRequest, NextResponse } from "next/server";

export interface ValidateDataRequestBody {
  userId: string;
  policyId: string;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateDataRequestBody;
    const { userId, policyId, data } = body;

    if (!userId || !policyId || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validationResult = await keyringClient.validateData(
      userId,
      policyId,
      data
    );
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
