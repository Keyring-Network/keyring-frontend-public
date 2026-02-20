import type { SessionStatus } from "@keyringnetwork/data-sharing-sdk";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ProgressStepsProps {
  status: SessionStatus | null;
  errorMessage?: string;
  onRetry?: () => void;
}

const steps = ["Connecting", "Verifying", "Completing"];

function getProgress(status: SessionStatus | null): { value: number; message: string } {
  switch (status) {
    case "session_created":
      return { value: 20, message: "Session ready. Waiting for user action." };
    case "client_connected":
      return { value: 45, message: "Client connected. Verification handshake running." };
    case "processing_started":
      return { value: 70, message: "Proof verification in progress." };
    case "processing_completed":
      return { value: 100, message: "Verification complete." };
    case "session_expired":
      return { value: 100, message: "Session expired." };
    case "processing_failed":
      return { value: 100, message: "Verification failed." };
    default:
      return { value: 10, message: "Initializing session..." };
  }
}

export default function ProgressSteps({ status, errorMessage, onRetry }: ProgressStepsProps) {
  const { value, message } = getProgress(status);
  const activeStep = value >= 100 ? 3 : value >= 70 ? 2 : 1;
  const hasError = Boolean(errorMessage) || status === "processing_failed";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= activeStep;
          return (
            <div key={step} className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                  isActive ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {stepNumber}
              </span>
              <span>{step}</span>
            </div>
          );
        })}
      </div>

      <Progress value={value} className="animate-fade-in" />

      <p className={`text-sm ${hasError ? "text-red-600" : "text-slate-600"}`}>
        {errorMessage || message}
      </p>

      {hasError && onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry verification
        </Button>
      )}
    </div>
  );
}
