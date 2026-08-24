/**
 * Every call to Keyring happens here, on the server.
 *
 * The API key authenticates the partner, not the user, so it must never reach the browser.
 * That is the reason this file exists at all: the page talks to our own routes, and only
 * those routes talk to Keyring.
 */

const BASE_URL = `${process.env.KEYRING_API_URL}/api/v1/data-sharing`;

export interface RequestedField {
  field_id: string;
  label: string;
  description: string;
}

export interface Datasource {
  id: string;
  label: string;
  name: string;
  image: string;
}

export interface PartnerConfig {
  display_name: string;
  allowed_fields: RequestedField[];
  allowed_datasources: Datasource[];
  retention_days: number;
}

export interface RecordDetail {
  state: string;
  external_user_id: string | null;
  verified_data: Record<string, unknown>;
  unavailable_fields: string[];
  proof_metadata: Record<string, unknown>;
}

export interface Session {
  session_id: string;
  session_token: string;
  expires_at: string;
  requested_fields: string[];
  datasource_ids: string[];
}

/** A 4xx from Keyring, carrying the machine-readable code so callers can branch on it. */
export class KeyringError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    detail: string,
  ) {
    super(detail);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!process.env.KEYRING_API_URL || !process.env.KEYRING_API_KEY) {
    throw new Error("KEYRING_API_URL and KEYRING_API_KEY must be set");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.KEYRING_API_KEY,
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new KeyringError(
      response.status,
      body.code ?? "UNKNOWN",
      body.detail ?? `Keyring returned ${response.status}`,
    );
  }

  return body as T;
}

/** What this partner is allowed to ask for. Drives the pickers on the page. */
export const getPartner = () => call<PartnerConfig>("/partner");

/**
 * Open a request.
 *
 * `external_user_id` is our own identifier for the user. Keyring never resolves it or shows
 * it to anyone; it simply hands it back in the webhook, which is how we know whose data
 * arrived.
 */
export const createSession = (input: {
  requested_fields: string[];
  datasource_ids: string[];
  purpose: string;
  external_user_id: string;
}) =>
  call<Session>("/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });

/**
 * Read a record, values included.
 *
 * The fallback when a webhook has not arrived. 404 until a proof is accepted, 410 once
 * retention has purged the values.
 */
export const getRecord = (sessionId: string) =>
  call<RecordDetail>(`/records/${sessionId}`);
