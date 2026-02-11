import { HttpClient } from './HttpClient';
import { WebSocketClient } from './WebSocketClient';
import { PollingClient } from './PollingClient';
import {
  SDKConfig,
  CreateSessionParams,
  Session,
  SessionResult,
  EventHandlers,
  PollOptions,
  StopFunction,
  WebSocketConnection,
  DataSharingError,
  ErrorCode,
} from './types';

/**
 * Main SDK class for Keyring Data Sharing
 * Platform-agnostic: works in browser, Node.js, and React Native
 */
export class DataSharingSDK {
  private httpClient: HttpClient;
  private pollingClient: PollingClient;
  private config: Required<SDKConfig>;
  private activeConnections: Map<string, WebSocketClient> = new Map();

  constructor(config: SDKConfig) {
    this.validateConfig(config);
    
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || this.getDefaultBaseUrl(config.environment),
      environment: config.environment || 'production',
      timeout: config.timeout || 30000,
      debug: config.debug || false,
    };

    this.httpClient = new HttpClient(this.config);
    this.pollingClient = new PollingClient(this.httpClient, this.config.debug);
  }

  private validateConfig(config: SDKConfig): void {
    if (!config.apiKey) {
      throw new DataSharingError('INVALID_CONFIG', 'API key is required');
    }

    if (config.timeout && config.timeout < 1000) {
      throw new DataSharingError('INVALID_CONFIG', 'Timeout must be at least 1000ms');
    }
  }

  private getDefaultBaseUrl(environment?: string): string {
    switch (environment) {
      case 'production':
        return 'https://api.keyring.network';
      case 'sandbox':
        return 'https://api.sandbox.keyring.network';
      case 'development':
      default:
        return 'http://localhost:8000';
    }
  }

  /**
   * Create a new data sharing session
   * 
   * @example
   * ```typescript
   * const session = await sdk.createSession({
   *   originUrl: 'https://partner.example.com',
   *   requestedFields: ['user.country', 'user.kyc_level'],
   *   datasourceId: 'binance' // optional
   * });
   * 
   * console.log(session.sessionId);      // 'uuid'
   * console.log(session.qrCodeData);     // 'keyringapp://...'
   * console.log(session.sessionToken);   // 'token-for-auth'
   * ```
   */
  async createSession(params: CreateSessionParams): Promise<Session> {
    if (!params.originUrl) {
      throw new DataSharingError('INVALID_CONFIG', 'originUrl is required');
    }

    if (!params.requestedFields || params.requestedFields.length === 0) {
      throw new DataSharingError('INVALID_CONFIG', 'requestedFields must not be empty');
    }

    return this.httpClient.createSession(params);
  }

  /**
   * Connect to WebSocket for real-time session updates
   * 
   * @example
   * ```typescript
   * const connection = sdk.connect(sessionId, sessionToken, {
   *   onStatusChange: (status, data) => {
   *     console.log('Status:', status);
   *     if (status === 'processing_completed') {
   *       console.log('Result:', data?.verifiedData);
   *     }
   *   },
   *   onError: (error) => {
   *     console.error('Error:', error);
   *   }
   * });
   * 
   * // Later, disconnect
   * connection.disconnect();
   * ```
   */
  connect(
    sessionId: string,
    sessionToken: string,
    handlers: EventHandlers
  ): WebSocketConnection {
    // Disconnect existing connection for this session
    const existingConnection = this.activeConnections.get(sessionId);
    if (existingConnection) {
      existingConnection.disconnect();
      this.activeConnections.delete(sessionId);
    }

    const wsClient = new WebSocketClient(
      sessionId,
      sessionToken,
      this.config.baseUrl,
      handlers,
      this.config.debug
    );

    // Store reference
    this.activeConnections.set(sessionId, wsClient);

    // Auto-remove from map when disconnected
    const originalDisconnect = wsClient.disconnect.bind(wsClient);
    wsClient.disconnect = () => {
      originalDisconnect();
      this.activeConnections.delete(sessionId);
    };

    // Connect
    wsClient.connect().catch((error) => {
      handlers.onError?.(
        error instanceof DataSharingError
          ? error
          : new DataSharingError('WEBSOCKET_ERROR', 'Failed to connect', error)
      );
    });

    return wsClient;
  }

  /**
   * Start polling for session updates (fallback when WebSocket unavailable)
   * 
   * @example
   * ```typescript
   * const stopPolling = sdk.poll(sessionId, sessionToken, {
   *   interval: 2000,  // Poll every 2 seconds
   *   timeout: 300000, // Stop after 5 minutes
   *   onUpdate: (result) => {
   *     console.log('Status:', result.status);
   *     if (result.status === 'processing_completed') {
   *       console.log('Data:', result.verifiedData);
   *       stopPolling(); // Stop polling
   *     }
   *   }
   * });
   * ```
   */
  poll(
    sessionId: string,
    sessionToken: string,
    options: PollOptions = {}
  ): StopFunction {
    return this.pollingClient.startPolling(sessionId, sessionToken, options);
  }

  /**
   * Get current session status
   * 
   * @example
   * ```typescript
   * const result = await sdk.getSession(sessionId, sessionToken);
   * console.log(result.status); // 'processing_completed'
   * ```
   */
  async getSession(sessionId: string, sessionToken: string): Promise<SessionResult> {
    return this.httpClient.getSession(sessionId, sessionToken);
  }

  /**
   * Get session result
   * 
   * @example
   * ```typescript
   * const result = await sdk.getResult(sessionId, sessionToken);
   * console.log(result.verifiedData); // { 'user.country': 'DE', ... }
   * ```
   */
  async getResult(sessionId: string, sessionToken: string): Promise<SessionResult> {
    return this.httpClient.getResult(sessionId, sessionToken);
  }

  /**
   * Disconnect all active connections
   * Useful for cleanup when component unmounts
   */
  disconnectAll(): void {
    if (this.config.debug) {
      console.log(`[DataSharingSDK] Disconnecting ${this.activeConnections.size} connections`);
    }

    for (const [sessionId, connection] of this.activeConnections) {
      connection.disconnect();
    }
    
    this.activeConnections.clear();
  }
}