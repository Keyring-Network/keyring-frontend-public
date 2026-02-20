"use client";

import { useCallback, useEffect, useRef } from "react";
import { DataSharingError, SessionStatus } from "@keyringnetwork/data-sharing-sdk";
import { Api } from "@/helpers/api";
import { BackendSessionResult } from "@/types";

interface UseBackendPollingParams {
  apiClient: Api;
  onStatusChange: (status: SessionStatus) => void;
  onResult: (result: BackendSessionResult) => void;
  onComplete: (result: BackendSessionResult) => void;
  onTimeout: (error: DataSharingError) => void;
  completedTimeoutMs?: number;
}

interface BackendResultWithFallback extends BackendSessionResult {
  result?: unknown;
}

export function useBackendPolling({
  apiClient,
  onStatusChange,
  onResult,
  onComplete,
  onTimeout,
  completedTimeoutMs = 60000,
}: UseBackendPollingParams) {
  const pollingIntervalRef = useRef<number | null>(null);
  const completedAtRef = useRef<number | null>(null);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const startBackendPolling = useCallback(
    (sessionId: string) => {
      clearPolling();

      pollingIntervalRef.current = window.setInterval(async () => {
        try {
          const data = await apiClient.getSession(sessionId);
          const nextStatus = data.status;
          onStatusChange(nextStatus);

          if (
            nextStatus === "processing_completed" ||
            nextStatus === "processing_failed" ||
            nextStatus === "session_expired"
          ) {
            onResult(data);

            if (nextStatus === "processing_completed") {
              if (!completedAtRef.current) {
                completedAtRef.current = Date.now();
              }

              const fallbackData = data as BackendResultWithFallback;
              const hasVerifiedData = fallbackData.verifiedData || fallbackData.result;
              const timeElapsed = Date.now() - completedAtRef.current;

              if (hasVerifiedData) {
                clearPolling();
                completedAtRef.current = null;
                onComplete(data);
              } else if (timeElapsed > completedTimeoutMs) {
                clearPolling();
                completedAtRef.current = null;
                onTimeout(
                  new DataSharingError(
                    "TIMEOUT",
                    "Verification completed but data not received within 60 seconds. Please try again.",
                  ),
                );
              }
            } else {
              clearPolling();
            }
          }
        } catch {
          // Ignore polling glitches and keep trying.
        }
      }, 2000);
    },
    [
      apiClient,
      clearPolling,
      completedTimeoutMs,
      onComplete,
      onResult,
      onStatusChange,
      onTimeout,
    ],
  );

  useEffect(
    () => () => {
      clearPolling();
      completedAtRef.current = null;
    },
    [clearPolling],
  );

  return {
    clearPolling,
    startBackendPolling,
  };
}
