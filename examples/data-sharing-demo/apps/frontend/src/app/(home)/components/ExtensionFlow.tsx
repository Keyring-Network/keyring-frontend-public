import { useEffect, useRef } from "react";
import type {
  DataSharingError,
  Session,
  SessionStatus,
} from "@keyringnetwork/data-sharing-sdk";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProgressSteps from "@/app/(home)/components/ProgressSteps";

interface ExtensionFlowProps {
  session: Session;
  status: SessionStatus | null;
  error: DataSharingError | null;
  onBack: () => void;
  onLaunch: () => Promise<void>;
  onRetry: () => void;
}

export default function ExtensionFlow({
  session,
  status,
  error,
  onBack,
  onLaunch,
  onRetry,
}: ExtensionFlowProps) {
  const hasLaunched = useRef(false);

  useEffect(() => {
    if (hasLaunched.current) return;
    hasLaunched.current = true;
    void onLaunch();
  }, [onLaunch]);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Extension verification</CardTitle>
        <CardDescription>
          Complete the verification in your browser extension window.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProgressSteps
          status={status}
          errorMessage={error?.message}
          onRetry={onRetry}
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          If the extension does not open automatically, ensure Keyring Extension
          is installed and allow popups for this site.
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={() => void onLaunch()}>
            Launch extension
          </Button>
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>

        <p className="text-xs text-slate-500">Session: {session.sessionId}</p>
      </CardContent>
    </Card>
  );
}
