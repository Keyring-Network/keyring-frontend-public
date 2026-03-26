import type { DataSharingError } from "@keyringnetwork/data-sharing-sdk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  error: DataSharingError;
  onRetry: () => void;
  onBack: () => void;
}

function getErrorContent(error: DataSharingError): {
  title: string;
  message: string;
  hint?: string;
  retryLabel: string;
} {
  const full = `${error.code} ${error.message}`.toLowerCase();

  if (full.includes("extension") && (full.includes("install") || full.includes("not found"))) {
    return {
      title: "Extension not installed",
      message: "Keyring browser extension was not detected.",
      hint: "Install Keyring Extension, refresh this page, then retry.",
      retryLabel: "Retry launch",
    };
  }

  if (full.includes("reject") || full.includes("denied") || full.includes("cancel")) {
    return {
      title: "Verification rejected",
      message: "The verification request was rejected by the user.",
      hint: "Retry and approve the request in the app or extension.",
      retryLabel: "Retry verification",
    };
  }

  if (full.includes("fetch") || full.includes("network")) {
    return {
      title: "Network error",
      message: "Network request failed while creating or tracking session.",
      hint: "Check your internet connection and backend availability.",
      retryLabel: "Try again",
    };
  }

  if (full.includes("expired")) {
    return {
      title: "Session expired",
      message: "The verification session expired before completion.",
      hint: "Start a new session and complete verification promptly.",
      retryLabel: "Start new session",
    };
  }

  if (full.includes("backend") || full.includes("cors") || full.includes("localhost")) {
    return {
      title: "Backend unavailable",
      message: "The demo backend could not be reached.",
      hint: "Ensure backend is running on port 8000.",
      retryLabel: "Retry",
    };
  }

  return {
    title: "Verification error",
    message: error.message,
    retryLabel: "Try again",
  };
}

export default function ErrorDisplay({ error, onRetry, onBack }: ErrorDisplayProps) {
  const content = getErrorContent(error);

  return (
    <Alert className="animate-shake border-red-200 bg-red-50">
      <AlertTitle className="text-red-900">{content.title}</AlertTitle>
      <AlertDescription className="space-y-2 text-red-700">
        <p>{content.message}</p>
        {content.hint && <p>{content.hint}</p>}
        <p>
          Need help? <a className="font-semibold underline" href="https://keyring.network" target="_blank" rel="noreferrer">Contact support</a>
        </p>
      </AlertDescription>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="destructive" onClick={onRetry}>
          {content.retryLabel}
        </Button>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </Alert>
  );
}
