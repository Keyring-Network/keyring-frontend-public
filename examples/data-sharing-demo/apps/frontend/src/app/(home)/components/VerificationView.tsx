"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DataSharingError } from "@keyringnetwork/data-sharing-sdk";
import { useDataSharing } from "@/hooks/useDataSharing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MobileFlow from "@/app/(home)/components/MobileFlow";
import ExtensionFlow from "@/app/(home)/components/ExtensionFlow";
import VerificationResult from "@/app/(home)/components/VerificationResult";
import ErrorDisplay from "@/components/ErrorDisplay";

interface VerificationViewProps {
  requestedFields: string[];
  datasource: string;
  flowType: "mobile" | "extension";
  onBack: () => void;
}

export default function VerificationView({
  requestedFields,
  datasource,
  flowType,
  onBack,
}: VerificationViewProps) {
  const hasInitiated = useRef(false);
  const [now, setNow] = useState(() => Date.now());

  const {
    session,
    status,
    result,
    error,
    isLoading,
    startVerification,
    launchExtension,
    cleanupSession,
    setFlowType,
  } = useDataSharing({
    requestedFields,
    datasourceId: datasource,
    onComplete: (data) => {
      console.log("Verification complete:", data);
    },
    onError: (err) => {
      console.error("Verification error:", err);
    },
  });

  useEffect(() => {
    if (hasInitiated.current) return;
    if (requestedFields.length > 0 && !session && !isLoading && !error) {
      hasInitiated.current = true;
      setFlowType(flowType);
      startVerification();
    }
  }, [
    requestedFields,
    session,
    isLoading,
    error,
    startVerification,
    flowType,
    setFlowType,
  ]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const expiresInSeconds = useMemo(() => {
    if (!session) return 0;
    const expiresAt = new Date(session.expiresAt).getTime();
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  }, [now, session]);

  const handleBack = async () => {
    await cleanupSession();
    onBack();
  };

  const handleRetry = async () => {
    await cleanupSession();
    hasInitiated.current = false;
    await startVerification();
  };

  const effectiveError = useMemo(() => {
    if (error) return error;
    if (status === "processing_failed") {
      return new DataSharingError(
        "UNKNOWN",
        result?.error || "Verification failed",
      );
    }
    if (status === "session_expired") {
      return new DataSharingError("UNKNOWN", "Session expired");
    }
    return null;
  }, [error, result?.error, status]);

  if (status === "processing_completed" && result) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <VerificationResult
          result={result}
          onRestart={() => {
            void handleBack();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="mb-6">
        <Button type="button" variant="ghost" onClick={() => void handleBack()}>
          Back to flow selection
        </Button>
      </div>

      {isLoading && !session && (
        <Card>
          <CardHeader>
            <CardTitle>Preparing session</CardTitle>
            <CardDescription>
              Creating secure verification session...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
          </CardContent>
        </Card>
      )}

      {effectiveError && (
        <ErrorDisplay
          error={effectiveError}
          onRetry={() => {
            void handleRetry();
          }}
          onBack={() => {
            void handleBack();
          }}
        />
      )}

      {session && !effectiveError && flowType === "mobile" && (
        <MobileFlow
          session={session}
          status={status}
          error={error}
          expiresInSeconds={expiresInSeconds}
          onBack={() => {
            void handleBack();
          }}
          onRetry={() => {
            void handleRetry();
          }}
        />
      )}

      {session && !effectiveError && flowType === "extension" && (
        <ExtensionFlow
          session={session}
          status={status}
          error={error}
          onBack={() => {
            void handleBack();
          }}
          onLaunch={launchExtension}
          onRetry={() => {
            void handleRetry();
          }}
        />
      )}
    </div>
  );
}
