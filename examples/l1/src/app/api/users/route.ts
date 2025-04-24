import keyringClient from "@/services/keyring";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await keyringClient.createUser(email, firstName, lastName);
    return NextResponse.json(user);
  } catch (error: unknown) {
    const errorResponse = error as {
      response?: { data?: { error?: string }; status?: number };
    };
    return NextResponse.json(
      { error: errorResponse.response?.data?.error || "Failed to create user" },
      { status: errorResponse.response?.status || 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("page_size") || "100");

    const users = await keyringClient.getUsers(page, pageSize);
    return NextResponse.json(users);
  } catch (error: unknown) {
    const errorResponse = error as {
      response?: { data?: { detail?: string }; status?: number };
    };
    return NextResponse.json(
      { error: errorResponse.response?.data?.detail || "Failed to get users" },
      { status: errorResponse.response?.status || 500 }
    );
  }
}
