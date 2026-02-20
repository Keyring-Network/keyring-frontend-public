"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
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
import { useBackendPolling } from "@/hooks/dataSharing/useBackendPolling";
import { useSessionLifecycle } from "@/hooks/dataSharing/useSessionLifecycle";
import { useSdkSession } from "@/hooks/dataSharing/useSdkSession";
import { normalizeDataSharingError } from "@/lib/dataSharing/normalizeError";

/**
 * React hook for Keyring Data Sharing SDK
 * Manages session lifecycle, WebSocket connection, and state
 */
export function useDataSharing(
  options: UseDataSharingOptions,
): UseDataSharingReturn {
  const apiClientRef = useRef<Api>(new Api());
  const apiClient = apiClientRef.current;

  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [result, setResult] = useState<BackendSessionResult | null>(null);
  const [error, setError] = useState<DataSharingError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [flowType, setFlowType] = useState<DataSharingFlowType | null>(null);
  const onCompleteRef = useRef(options.onComplete);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onCompleteRef.current = options.onComplete;
    onErrorRef.current = options.onError;
  }, [options.onComplete, options.onError]);

  const handleInvalidConfig = useCallback((configError: DataSharingError) => {
    setError(configError);
  }, []);

  const { sdkRef } = useSdkSession({
    requestedFields: options.requestedFields,
    datasourceId: options.datasourceId,
    onInvalidConfig: handleInvalidConfig,
  });

  const { startBackendPolling } = useBackendPolling({
    apiClient,
    onStatusChange: setStatus,
    onResult: setResult,
    onComplete: (data) => onCompleteRef.current?.(data),
    onTimeout: setError,
  });

  const {
    activeSessionIdRef,
    connectionRef,
    cleanupSession,
    disconnectActiveSession,
  } = useSessionLifecycle({
    apiClient,
    sdkRef,
    setSession,
    setStatus,
    setResult,
    setError,
    setIsLoading,
  });

  const connectToSession = useCallback(
    (sessionId: string, sessionToken: string) => {
      if (!sdkRef.current) {
        return;
      }

      const connection = sdkRef.current.connect(sessionId, sessionToken, {
        onStatusChange: (newStatus, data) => {
          setStatus(newStatus);

          if (newStatus === "processing_completed" && data) {
            disconnectActiveSession();
          }

          if (
            newStatus === "processing_failed" ||
            newStatus === "session_expired"
          ) {
            disconnectActiveSession();
          }
        },
        onError: (err) => {
          setError(err);
          onErrorRef.current?.(err);
        },
      });

      connectionRef.current = connection;
    },
    [connectionRef, disconnectActiveSession, sdkRef],
  );

  const startVerification = useCallback(async () => {
    if (!sdkRef.current) {
      setError(new DataSharingError("INVALID_CONFIG", "SDK not initialized"));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setStatus(null);
    disconnectActiveSession();

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
    activeSessionIdRef,
    connectToSession,
    disconnectActiveSession,
    sdkRef,
  ]);

  const launchExtension = useCallback(async () => {
    if (!sdkRef.current || !session) {
      setError(
        new DataSharingError("INVALID_CONFIG", "Session not initialized"),
      );
      return;
    }

    setError(null);
    startBackendPolling(session.sessionId);

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
  }, [
    options.datasourceId,
    options.requestedFields,
    sdkRef,
    session,
    startBackendPolling,
  ]);

  const reset = useCallback(() => {
    void cleanupSession();
    setFlowType(null);
  }, [cleanupSession]);

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
