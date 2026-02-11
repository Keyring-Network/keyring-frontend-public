import axios, { AxiosInstance, AxiosError } from "axios";
import {
  SDKConfig,
  CreateSessionParams,
  CreateSessionResponse,
  Session,
  SessionResult,
  DataSharingError,
} from "./types";

/**
 * HTTP client for Data Sharing API
 */
export class HttpClient {
  private client: AxiosInstance;
  private debug: boolean;

  constructor(config: SDKConfig) {
    this.debug = config.debug || false;

    const baseURL = this.resolveBaseUrl(config);

    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
      },
    });

    this.setupInterceptors();
  }

  private resolveBaseUrl(config: SDKConfig): string {
    if (config.baseUrl) {
      return config.baseUrl;
    }

    switch (config.environment) {
      case "production":
        return "https://api.keyring.network";
      case "sandbox":
        return "https://api.sandbox.keyring.network";
      case "development":
      default:
        return "http://localhost:8000";
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.debug) {
          console.log(
            `[DataSharingSDK] Request: ${config.method?.toUpperCase()} ${config.url}`,
          );
        }
        return config;
      },
      (error) => Promise.reject(this.handleAxiosError(error)),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (this.debug) {
          console.log(
            `[DataSharingSDK] Response: ${response.status} ${response.config.url}`,
          );
        }
        return response;
      },
      (error) => Promise.reject(this.handleAxiosError(error)),
    );
  }

  private handleAxiosError(error: AxiosError): DataSharingError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as { message?: string; error?: string };
      const message = data?.message || data?.error || error.message;

      if (status === 401 || status === 403) {
        return new DataSharingError(
          "INVALID_CONFIG",
          `Authentication failed: ${message}`,
          error.response.data,
        );
      }

      if (status === 404) {
        return new DataSharingError(
          "SESSION_NOT_FOUND",
          `Session not found: ${message}`,
          error.response.data,
        );
      }

      if (status === 400) {
        return new DataSharingError(
          "INVALID_CONFIG",
          `Bad request: ${message}`,
          error.response.data,
        );
      }

      return new DataSharingError(
        "NETWORK_ERROR",
        `Server error (${status}): ${message}`,
        error.response.data,
      );
    }

    if (error.request) {
      // Request made but no response received
      return new DataSharingError(
        "NETWORK_ERROR",
        `Network error: ${error.message}`,
        error.request,
      );
    }

    // Something else happened
    return new DataSharingError("UNKNOWN", `Error: ${error.message}`, error);
  }

  /**
   * Create a new data sharing session
   */
  async createSession(params: CreateSessionParams): Promise<Session> {
    try {
      const response = await this.client.post<CreateSessionResponse>(
        "/api/v1/data-sharing/sessions",
        {
          origin_url: params.originUrl,
          requested_fields: params.requestedFields,
          datasource_id: params.datasourceId,
        },
      );

      return this.mapSessionResponse(response.data);
    } catch (error) {
      if (error instanceof DataSharingError) {
        throw error;
      }
      throw new DataSharingError(
        "SESSION_CREATION_FAILED",
        "Failed to create session",
        error,
      );
    }
  }

  /**
   * Get session by ID
   */
  async getSession(
    sessionId: string,
    sessionToken: string,
  ): Promise<SessionResult> {
    try {
      const response = await this.client.get<CreateSessionResponse>(
        `/api/v1/data-sharing/sessions/${sessionId}`,
        {
          headers: {
            "X-Session-Token": sessionToken,
          },
        },
      );

      return this.mapSessionResult(response.data);
    } catch (error) {
      if (error instanceof DataSharingError) {
        throw error;
      }
      throw new DataSharingError(
        "SESSION_NOT_FOUND",
        "Failed to get session",
        error,
      );
    }
  }

  /**
   * Get session result
   */
  async getResult(
    sessionId: string,
    sessionToken: string,
  ): Promise<SessionResult> {
    try {
      const response = await this.client.get<CreateSessionResponse>(
        `/api/v1/data-sharing/sessions/${sessionId}/result`,
        {
          headers: {
            "X-Session-Token": sessionToken,
          },
        },
      );

      return this.mapSessionResult(response.data);
    } catch (error) {
      if (error instanceof DataSharingError) {
        throw error;
      }
      throw new DataSharingError(
        "POLLING_ERROR",
        "Failed to get result",
        error,
      );
    }
  }

  private mapSessionResponse(data: CreateSessionResponse): Session {
    return {
      sessionId: data.session_id,
      sessionToken: data.session_token,
      qrCodeData: data.qr_code_data,
      expiresAt: data.expires_at,
      status: data.status,
      requestedFields: data.requested_fields,
      allowedFields: data.allowed_fields,
    };
  }

  private mapSessionResult(data: CreateSessionResponse): SessionResult {
    return {
      sessionId: data.session_id,
      status: data.status,
      verifiedData: data.result,
      error: data.error,
      proofMetadata: data.proof_metadata,
    };
  }
}
