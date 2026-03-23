"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DataSharingSDK,
  Session,
  SessionStatus,
  DataSharingError,
} from "@keyringnetwork/data-sharing-sdk";
import {
  BackendSessionResult,
  DataSharingFlowType,
  UseDataSharingOptions,
  UseDataSharingReturn,
} from "@/types";
import { Api } from "@/helpers/api";
import { normalizeDataSharingError } from "@/lib/normalizeError";

/**
 * React hook for Keyring Data Sharing SDK
 * Owns the full flow: SDK lifecycle, connection, polling, and cleanup.
 */
export function useDataSharing(
  options: UseDataSharingOptions,
): UseDataSharingReturn {
  const apiClientRef = useRef<Api>(new Api());
  const apiClient = apiClientRef.current;
  const sdkRef = useRef<DataSharingSDK | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const pollingStartedAtRef = useRef<number | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [result, setResult] = useState<BackendSessionResult | null>(null);
  const [error, setError] = useState<DataSharingError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [flowType, setFlowType] = useState<DataSharingFlowType | null>(null);
  const onCompleteRef = useRef(options.onComplete);
  const onErrorRef = useRef(options.onError);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollingStartedAtRef.current = null;
  }, []);

  const disconnectActiveSession = useCallback(() => {
    sdkRef.current?.disconnectAll();
  }, []);

  const deleteSessionReference = useCallback(
    async (sessionId: string) => {
      try {
        await apiClient.deleteSession(sessionId);
      } catch (err) {
        console.warn("Failed to delete backend session reference:", err);
      }
    },
    [apiClient],
  );

  const cleanupSession = useCallback(async () => {
    const currentSessionId = activeSessionIdRef.current;
    clearPolling();
    disconnectActiveSession();

    if (currentSessionId) {
      await deleteSessionReference(currentSessionId);
    }

    activeSessionIdRef.current = null;
    setSession(null);
    setStatus(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, [clearPolling, deleteSessionReference, disconnectActiveSession]);

  const startBackendPolling = useCallback(
    (sessionId: string, completedTimeoutMs = 60000) => {
      clearPolling();
      pollingStartedAtRef.current = Date.now();

      pollingIntervalRef.current = window.setInterval(async () => {
        const startedAt = pollingStartedAtRef.current ?? Date.now();
        const timeElapsed = Date.now() - startedAt;

        if (timeElapsed > completedTimeoutMs) {
          clearPolling();
          setError(
            new DataSharingError(
              "TIMEOUT",
              "Verification completed but data not received within 60 seconds. Please try again.",
            ),
          );
          return;
        }

        try {
          const data = await apiClient.getSession(sessionId);

          if (data.verifiedData) {
            clearPolling();
            setResult(data);
            onCompleteRef.current?.(data);
          }
        } catch {
          // Ignore transient polling glitches and keep trying until timeout.
        }
      }, 2000);
    },
    [apiClient, clearPolling],
  );

  const connectToSession = useCallback(
    (sessionId: string, sessionToken: string) => {
      if (!sdkRef.current) {
        return;
      }

      sdkRef.current.connect(sessionId, sessionToken, {
        onStatusChange: (newStatus, data) => {
          setStatus(newStatus);

          if (newStatus === "processing_completed" && data) {
            startBackendPolling(sessionId);
            disconnectActiveSession();
          }

          if (
            newStatus === "processing_failed" ||
            newStatus === "session_expired"
          ) {
            disconnectActiveSession();
            clearPolling();
          }
        },
        onError: (err) => {
          setError(err);
          onErrorRef.current?.(err);
        },
      });
    },
    [clearPolling, disconnectActiveSession, startBackendPolling],
  );

  const startVerification = useCallback(async () => {
    await initializeSdk();

    if (!sdkRef.current) {
      setError(new DataSharingError("INVALID_CONFIG", "SDK not initialized"));
      return;
    }

    setIsLoading(true);
    setSession(null);
    setError(null);
    setResult(null);
    setStatus(null);
    clearPolling();
    disconnectActiveSession();

    const previousSessionId = activeSessionIdRef.current;
    if (previousSessionId) {
      await deleteSessionReference(previousSessionId);
      activeSessionIdRef.current = null;
    }

    try {
      const newSession = await sdkRef.current.createSession({
        originUrl: window.location.href,
      });

      setSession(newSession);
      setStatus(newSession.status);
      activeSessionIdRef.current = newSession.sessionId;

      try {
        await apiClient.createSession({
          sessionId: newSession.sessionId,
          sessionToken: newSession.sessionToken,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Failed to store session in backend:", err);
      }

      connectToSession(newSession.sessionId, newSession.sessionToken);
    } catch (err) {
      const dsError = normalizeDataSharingError(err);

      setError(dsError);
      onErrorRef.current?.(dsError);
    } finally {
      setIsLoading(false);
    }
  }, [
    apiClient,
    clearPolling,
    connectToSession,
    deleteSessionReference,
    disconnectActiveSession,
  ]);

  const launchExtension = useCallback(async () => {
    if (!sdkRef.current || !session) {
      setError(
        new DataSharingError("INVALID_CONFIG", "Session not initialized"),
      );
      return;
    }

    setError(null);

    try {
      await sdkRef.current.launchExtension({
        name: "Data Sharing Demo",
        app_url: window.location.origin,
        logo_url: `${window.location.origin}/logo.svg`,
        websocket: {
          session_id: session.sessionId,
          session_token: session.sessionToken,
        },
        data_sharing: {
          requested_fields: options.requestedFields,
          datasource_id: options.datasourceId,
        },
        krn_config: {
          keyring_api_url: process.env.NEXT_PUBLIC_BACKEND_URL || "",
        },
      });
    } catch (err) {
      const dsError = normalizeDataSharingError(err);
      setError(dsError);
      onErrorRef.current?.(dsError);
    }
  }, [options.datasourceId, options.requestedFields, sdkRef, session]);

  const reset = useCallback(() => {
    void cleanupSession();
    setFlowType(null);
  }, [cleanupSession]);

  const initializeSdk = async () => {
    if (sdkRef.current) {
      return;
    }

    try {
      const { token } = await apiClient.getClientToken();

      disconnectActiveSession();
      sdkRef.current = new DataSharingSDK({
        clientToken: token,
        baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "",
        debug: process.env.NODE_ENV === "development",
        requestedFields: options.requestedFields,
        datasourceId: options.datasourceId,
      });
    } catch (error) {
      setError(
        error instanceof DataSharingError
          ? error
          : new DataSharingError(
              "INVALID_CONFIG",
              "Client token not configured",
            ),
      );
      sdkRef.current = null;
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionId = activeSessionIdRef.current;
      clearPolling();
      disconnectActiveSession();
      if (sessionId) {
        void apiClient.deleteSession(sessionId);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [apiClient, clearPolling, disconnectActiveSession]);

  useEffect(() => {
    onCompleteRef.current = options.onComplete;
    onErrorRef.current = options.onError;
  }, [options.onComplete, options.onError]);

  return {
    session,
    status,
    result,
    error,
    isLoading,
    startVerification,
    flowType,
    setFlowType,
    launchExtension,
    cleanupSession,
    reset,
  };
}
