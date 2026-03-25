import { NextRequest, NextResponse } from "next/server";

type Environment = "dev" | "prod";

const DEV_API_BASE_URL =
  process.env.NEXT_PUBLIC_KEYRING_API_BASE_URL_DEV ||
  "https://main.api.keyring-backend.krndev.net";

const PROD_API_BASE_URL =
  process.env.NEXT_PUBLIC_KEYRING_API_BASE_URL_PROD ||
  "https://main.api.keyring-backend.krnprod.net";

const getBaseUrl = (environment: Environment): string =>
  environment === "prod" ? PROD_API_BASE_URL : DEV_API_BASE_URL;

export async function POST(request: NextRequest) {
  let environment: unknown;

  try {
    const body = (await request.json()) as { environment?: unknown };
    environment = body.environment;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (environment !== "dev" && environment !== "prod") {
    return NextResponse.json(
      { error: "environment must be either 'dev' or 'prod'" },
      { status: 400 },
    );
  }

  const apiKey = process.env.KEYRING_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: `Missing server configuration for ${environment} client-token minting`,
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `${getBaseUrl(environment)}/api/v1/connect/client-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        cache: "no-store",
      },
    );

    const responseBody = (await response.json().catch(() => null)) as {
      token?: string;
      expires_at?: string;
      error?: string;
    } | null;

    if (!response.ok || !responseBody?.token || !responseBody.expires_at) {
      return NextResponse.json(
        {
          error:
            responseBody?.error ||
            `Failed to mint client token (${response.status})`,
        },
        { status: response.ok ? 500 : response.status },
      );
    }

    return NextResponse.json({
      token: responseBody.token,
      expiresAt: responseBody.expires_at,
    });
  } catch (error) {
    console.error("Failed to mint connect client token", error);
    return NextResponse.json(
      { error: "Failed to mint client token" },
      { status: 500 },
    );
  }
}
