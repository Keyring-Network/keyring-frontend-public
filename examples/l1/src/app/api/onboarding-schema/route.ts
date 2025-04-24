import keyringClient from "@/services/keyring";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the onboarding schema from the Keyring API
    const response = await keyringClient.request({
      method: "GET",
      url: "/api/l1/onboarding-schema",
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const errorResponse = error as {
      response?: { data?: { detail?: string }; status?: number };
    };

    return NextResponse.json(
      {
        error:
          errorResponse.response?.data?.detail ||
          "Failed to fetch onboarding schema",
      },
      { status: errorResponse.response?.status || 500 }
    );
  }
}
