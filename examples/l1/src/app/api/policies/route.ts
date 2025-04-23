import keyringClient from "@/services/keyring";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("page_size") || "100");

    const policies = await keyringClient.getPolicies(page, pageSize);
    return NextResponse.json(policies);
  } catch (error: unknown) {
    const errorResponse = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      {
        error:
          errorResponse.response?.data?.detail || "Failed to fetch policies",
      },
      { status: errorResponse.response?.status || 500 }
    );
  }
}
