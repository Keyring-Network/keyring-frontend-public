/**
 * Core types for Data Sharing SDK
 */

export interface SDKConfig {
  /** Partner API key */
  apiKey: string;
  /** Keyring API base URL */
  baseUrl?: string;
  /** Environment - affects default baseUrl */
  environment?: 'production' | 'sandbox' | 'development';
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export interface CreateSessionParams {
  /** Origin URL for the session */
  originUrl: string;
  /** Fields to request from user */
  requestedFields: string[];
  /** Specific datasource to use (optional) */
  datasourceId?: string;
}

export interface Session {
  /** Unique session identifier */
  sessionId: string;
  /** Token for session authentication */
  sessionToken: string;
  /** QR code data for mobile scanning */
  qrCodeData: string;
  /** Session expiration timestamp */
  expiresAt: string;
  /** Current session status */
  status: SessionStatus;
  /** Requested fields */
  requestedFields: string[];
  /** Allowed fields for this partner */
  allowedFields: string[];
}

export type SessionStatus = 
  | 'session_created'
  | 'client_connected'
  | 'processing_started'
  | 'processing_completed'
  | 'processing_failed'
  | 'session_expired';

export interface SessionResult {
  /** Session identifier */
  sessionId: string;
  /** Current status */
  status: SessionStatus;
  /** Verified data (only present when completed) */
  verifiedData?: Record<string, unknown>;
  /** Error message (only present when failed) */
  error?: string;
  /** Proof metadata (only present when completed) */
  proofMetadata?: ProofMetadata;
}

export interface ProofMetadata {
  /** Datasource that provided the data */
  datasourceId: string;
  /** Prover version used */
  proverVersion: string;
  /** Verification timestamp */
  verifiedAt: string;
}

export interface EventHandlers {
  /** Called when session status changes */
  onStatusChange?: (status: SessionStatus, data?: SessionResult) => void;
  /** Called on error */
  onError?: (error: DataSharingError) => void;
  /** Called when connection status changes */
  onConnectionChange?: (connected: boolean) => void;
}

export interface PollOptions {
  /** Polling interval in milliseconds (default: 2000) */
  interval?: number;
  /** Maximum polling duration in milliseconds (default: 300000 - 5 minutes) */
  timeout?: number;
  /** Callback for each poll update */
  onUpdate?: (result: SessionResult) => void;
}

export type StopFunction = () => void;

export interface WebSocketConnection {
  /** Disconnect from WebSocket */
  disconnect: () => void;
  /** Get current connection state */
  getState: () => ConnectionState;
  /** Send a message (for advanced use) */
  send?: (message: unknown) => void;
}

export type ConnectionState = 
  | 'CONNECTING'
  | 'CONNECTED'
  | 'CLOSING'
  | 'CLOSED'
  | 'RECONNECTING';

/** API Response types */
export interface CreateSessionResponse {
  session_id: string;
  session_token: string;
  qr_code_data: string;
  expires_at: string;
  status: SessionStatus;
  requested_fields: string[];
  allowed_fields: string[];
  result?: Record<string, unknown>;
  proof_metadata?: ProofMetadata;
  error?: string;
}

export interface GetSessionResponse {
  session_id: string;
  status: SessionStatus;
  datasource_id?: string;
  verified_data?: Record<string, unknown>;
  requested_fields: string[];
  created_at: string;
  updated_at: string;
}

/** WebSocket message types with discriminated unions */
export type WebSocketMessage =
  | ConnectedMessage
  | ClientConnectedMessage
  | ProcessingStartedMessage
  | ProcessingCompletedMessage
  | ProcessingFailedMessage
  | SessionExpiredMessage
  | ErrorMessage
  | HeartbeatMessage
  | HeartbeatResponseMessage;

export interface BaseWebSocketMessage {
  type: WebSocketMessageType;
  session_id: string;
  timestamp: number;
}

export type WebSocketMessageType =
  | 'connected'
  | 'client_connected'
  | 'processing_started'
  | 'processing_completed'
  | 'processing_failed'
  | 'session_expired'
  | 'error'
  | 'heartbeat'
  | 'heartbeat_response';

export interface ConnectedMessage extends BaseWebSocketMessage {
  type: 'connected';
  data?: {
    message?: string;
  };
}

export interface ClientConnectedMessage extends BaseWebSocketMessage {
  type: 'client_connected';
  data?: {
    client_type?: string;
    [key: string]: unknown;
  };
}

export interface ProcessingStartedMessage extends BaseWebSocketMessage {
  type: 'processing_started';
  data?: {
    message?: string;
    [key: string]: unknown;
  };
}

export interface ProcessingCompletedMessage extends BaseWebSocketMessage {
  type: 'processing_completed';
  data: SessionResult;
}

export interface ProcessingFailedMessage extends BaseWebSocketMessage {
  type: 'processing_failed';
  data: {
    error: string;
    [key: string]: unknown;
  };
}

export interface SessionExpiredMessage extends BaseWebSocketMessage {
  type: 'session_expired';
  data?: {
    message?: string;
  };
}

export interface ErrorMessage extends BaseWebSocketMessage {
  type: 'error';
  data: {
    message: string;
    code?: string;
    [key: string]: unknown;
  };
}

export interface HeartbeatMessage extends BaseWebSocketMessage {
  type: 'heartbeat';
}

export interface HeartbeatResponseMessage extends BaseWebSocketMessage {
  type: 'heartbeat_response';
  data?: {
    received_at?: number;
  };
}

/** Error types */
export type ErrorCode =
  | 'SESSION_CREATION_FAILED'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'WEBSOCKET_ERROR'
  | 'POLLING_ERROR'
  | 'INVALID_CONFIG'
  | 'ALREADY_CONNECTED'
  | 'NOT_CONNECTED'
  | 'TIMEOUT'
  | 'UNKNOWN';

export class DataSharingError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DataSharingError';
  }
}
