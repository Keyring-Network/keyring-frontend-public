/**
 * Where delivered webhooks are kept.
 *
 * In memory, so it empties on restart and is not shared between server instances. A real
 * integration replaces this file with its database and nothing else changes.
 */

export interface WebhookEvent {
  event_id: string;
  session_id: string;
  occurred_at: string;
  user_context: { external_user_id: string | null; purpose: string };
  verified_data: Record<string, unknown>;
  unavailable_fields: string[];
  datasource: { id: string | null };
  proof_metadata: Record<string, unknown>;
}

interface Store {
  bySession: Map<string, WebhookEvent>;
  seenEvents: Set<string>;
}

// Hung off globalThis so it survives the module reloads that `next dev` does on every edit.
const globalForStore = globalThis as typeof globalThis & {
  dataSharingStore?: Store;
};

const store: Store = (globalForStore.dataSharingStore ??= {
  bySession: new Map(),
  seenEvents: new Set(),
});

/** Whether this delivery has already been handled. Keyring retries, so it will repeat. */
export const alreadyHandled = (eventId: string) => store.seenEvents.has(eventId);

export const record = (event: WebhookEvent) => {
  store.seenEvents.add(event.event_id);
  store.bySession.set(event.session_id, event);
};

export const findBySession = (sessionId: string) => store.bySession.get(sessionId);
