import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
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
import { Separator } from "@/components/ui/separator";
import ProgressSteps from "@/app/(home)/components/ProgressSteps";

interface MobileFlowProps {
  session: Session;
  status: SessionStatus | null;
  error: DataSharingError | null;
  expiresInSeconds: number;
  onBack: () => void;
  onRetry: () => void;
}

function formatSeconds(seconds: number): string {
  const clamped = Math.max(seconds, 0);
  const minutes = Math.floor(clamped / 60);
  const rest = clamped % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function MobileFlow({
  session,
  status,
  error,
  expiresInSeconds,
  onBack,
  onRetry,
}: MobileFlowProps) {
  const statusText = useMemo(() => {
    if (status === "extension_connected" || status === "mobile_connected")
      return "Device connected. Continue in mobile app.";
    if (status === "processing_started")
      return "Verification submitted. Waiting for final proof.";
    if (status === "session_expired")
      return "Session expired. Start a new verification.";
    return "Scan the QR code with the Keyring mobile app.";
  }, [status]);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Mobile verification</CardTitle>
        <CardDescription>{statusText}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-lg animate-soft-pulse">
          <QRCodeSVG
            value={session.qrCodeData}
            size={220}
            level="H"
            includeMargin
          />
        </div>

        <p className="text-center text-sm text-slate-500" aria-live="polite">
          Session expires in {formatSeconds(expiresInSeconds)}
        </p>

        <ProgressSteps
          status={status}
          errorMessage={error?.message}
          onRetry={onRetry}
        />

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <p className="text-xs text-slate-500">
            Session: {session.sessionId.slice(0, 10)}...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
