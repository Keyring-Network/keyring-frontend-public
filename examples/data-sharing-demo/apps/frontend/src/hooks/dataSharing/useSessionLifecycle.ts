"use client";

import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  DataSharingError,
  DataSharingSDK,
  Session,
  SessionStatus,
} from "@keyringnetwork/data-sharing-sdk";
import { Api } from "@/helpers/api";
import { BackendSessionResult } from "@/types";

interface UseSessionLifecycleParams {
  apiClient: Api;
  sdkRef: RefObject<DataSharingSDK | null>;
  setSession: Dispatch<SetStateAction<Session | null>>;
  setStatus: Dispatch<SetStateAction<SessionStatus | null>>;
  setResult: Dispatch<SetStateAction<BackendSessionResult | null>>;
  setError: Dispatch<SetStateAction<DataSharingError | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

export function useSessionLifecycle({
  apiClient,
  sdkRef,
  setSession,
  setStatus,
  setResult,
  setError,
  setIsLoading,
}: UseSessionLifecycleParams) {
  const connectionRef = useRef<{ disconnect: () => void } | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

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

  const disconnectActiveSession = useCallback(() => {
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    sdkRef.current?.disconnectAll();
  }, [sdkRef]);

  const cleanupSession = useCallback(async () => {
    const currentSessionId = activeSessionIdRef.current;
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
  }, [
    deleteSessionReference,
    disconnectActiveSession,
    setError,
    setIsLoading,
    setResult,
    setSession,
    setStatus,
  ]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionId = activeSessionIdRef.current;
      if (!sessionId) {
        return;
      }

      disconnectActiveSession();
      void apiClient.deleteSession(sessionId);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [apiClient, disconnectActiveSession]);

  return {
    activeSessionIdRef,
    connectionRef,
    cleanupSession,
    disconnectActiveSession,
  };
}
