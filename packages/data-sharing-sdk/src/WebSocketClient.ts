import WebSocket from "ws";
import {
  EventHandlers,
  WebSocketConnection,
  ConnectionState,
  WebSocketMessage,
  SessionResult,
  DataSharingError,
  ProcessingCompletedMessage,
  ProcessingFailedMessage,
  ErrorMessage,
  ClientConnectedMessage,
} from "./types";

/**
 * WebSocket client for real-time session updates
 */
export class WebSocketClient implements WebSocketConnection {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private sessionToken: string;
  private baseUrl: string;
  private handlers: EventHandlers;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private state: ConnectionState = "CLOSED";
  private debug: boolean;

  constructor(
    sessionId: string,
    sessionToken: string,
    baseUrl: string,
    handlers: EventHandlers,
    debug = false,
  ) {
    this.sessionId = sessionId;
    this.sessionToken = sessionToken;
    this.baseUrl = baseUrl;
    this.handlers = handlers;
    this.debug = debug;
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws && this.state === "CONNECTED") {
      throw new DataSharingError(
        "ALREADY_CONNECTED",
        "WebSocket already connected",
      );
    }

    return new Promise((resolve, reject) => {
      try {
        this.state = "CONNECTING";

        // Convert HTTP/HTTPS to WS/WSS
        const wsUrl = this.baseUrl
          .replace("http://", "ws://")
          .replace("https://", "wss://");

        const url = `${wsUrl}/ws/data-sharing/session?sessionId=${encodeURIComponent(
          this.sessionId,
        )}&sessionToken=${encodeURIComponent(this.sessionToken)}`;

        if (this.debug) {
          console.log(`[DataSharingSDK] Connecting to WebSocket: ${url}`);
        }

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          if (this.debug) {
            console.log("[DataSharingSDK] WebSocket connected");
          }
          this.state = "CONNECTED";
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.handlers.onConnectionChange?.(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data =
              typeof event.data === "string"
                ? event.data
                : event.data.toString();
            const message = JSON.parse(data) as WebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            if (this.debug) {
              console.error(
                "[DataSharingSDK] Failed to parse WebSocket message:",
                error,
              );
            }
          }
        };

        this.ws.onclose = (event) => {
          if (this.debug) {
            console.log(
              `[DataSharingSDK] WebSocket closed: ${event.code} ${event.reason}`,
            );
          }

          this.cleanup();
          this.state = "CLOSED";
          this.handlers.onConnectionChange?.(false);

          // Attempt reconnect if not intentionally closed
          if (
            event.code !== 1000 &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          if (this.debug) {
            console.error("[DataSharingSDK] WebSocket error:", error);
          }
          this.handlers.onError?.(
            new DataSharingError(
              "WEBSOCKET_ERROR",
              "WebSocket error occurred",
              error,
            ),
          );
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.state === "CONNECTING") {
            this.ws?.close();
            reject(
              new DataSharingError("TIMEOUT", "WebSocket connection timeout"),
            );
          }
        }, 10000);
      } catch (error) {
        reject(
          new DataSharingError(
            "WEBSOCKET_ERROR",
            "Failed to connect WebSocket",
            error,
          ),
        );
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.debug) {
      console.log("[DataSharingSDK] Disconnecting WebSocket");
    }

    this.cleanup();

    if (this.ws) {
      this.ws.close(1000, "Normal closure");
      this.ws = null;
    }

    this.state = "CLOSED";
    this.handlers.onConnectionChange?.(false);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Send a message (for advanced use)
   */
  send(message: unknown): void {
    if (!this.ws || this.state !== "CONNECTED") {
      throw new DataSharingError("NOT_CONNECTED", "WebSocket not connected");
    }

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(message: WebSocketMessage): void {
    if (this.debug) {
      console.log(`[DataSharingSDK] WebSocket message: ${message.type}`);
    }

    switch (message.type) {
      case "connected":
        // Server confirmed connection
        break;

      case "client_connected": {
        const clientMsg = message as ClientConnectedMessage;
        this.handlers.onStatusChange?.("client_connected");
        break;
      }

      case "processing_started":
        this.handlers.onStatusChange?.("processing_started");
        break;

      case "processing_completed": {
        const completedMsg = message as ProcessingCompletedMessage;
        this.handlers.onStatusChange?.("processing_completed", completedMsg.data);
        break;
      }

      case "processing_failed": {
        const failedMsg = message as ProcessingFailedMessage;
        const result: SessionResult = {
          sessionId: message.session_id,
          status: "processing_failed",
          error: failedMsg.data.error,
        };
        this.handlers.onStatusChange?.("processing_failed", result);
        break;
      }

      case "session_expired":
        this.handlers.onStatusChange?.("session_expired");
        this.disconnect();
        break;

      case "error": {
        const errorMsg = message as ErrorMessage;
        this.handlers.onError?.(
          new DataSharingError(
            "WEBSOCKET_ERROR",
            errorMsg.data.message || "WebSocket error",
          ),
        );
        break;
      }

      case "heartbeat_response":
        // Heartbeat acknowledged
        break;

      default:
        if (this.debug) {
          console.warn(
            `[DataSharingSDK] Unknown message type: ${message.type}`,
          );
        }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.state === "CONNECTED") {
        this.send({
          type: "heartbeat",
          session_id: this.sessionId,
          timestamp: Date.now(),
        });
      }
    }, 30000); // 30 second heartbeat
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.state = "RECONNECTING";

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000,
    );

    if (this.debug) {
      console.log(
        `[DataSharingSDK] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
      );
    }

    setTimeout(() => {
      this.connect().catch((error) => {
        if (this.debug) {
          console.error("[DataSharingSDK] Reconnect failed:", error);
        }
      });
    }, delay);
  }
}
