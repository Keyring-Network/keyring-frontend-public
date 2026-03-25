import type { SessionResult } from "@keyringnetwork/data-sharing-sdk";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackendSessionResult } from "@/types";

interface VerificationResultProps {
  result: BackendSessionResult;
  onRestart: () => void;
}

export default function VerificationResult({
  result,
  onRestart,
}: VerificationResultProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 animate-pop-in">
          OK
        </div>
        <CardTitle>Verification successful</CardTitle>
        <CardDescription>Proof received and verified.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-emerald-800">
            Verified data
          </h3>
          <div className="space-y-2 text-sm text-emerald-900">
            {result.verifiedData &&
              Object.entries(result.verifiedData).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 border-b border-emerald-200 pb-2"
                >
                  <span className="font-medium">{key}</span>
                  <span>{String(value)}</span>
                </div>
              ))}
          </div>
        </div>

        {result.proofMetadata && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Datasource:</span>{" "}
              {result.proofMetadata.datasourceId}
            </p>
            <p>
              <span className="font-semibold">Verified at:</span>{" "}
              {new Date(result.proofMetadata.verifiedAt).toLocaleString()}
            </p>
            <p>
              <span className="font-semibold">Prover:</span>{" "}
              {result.proofMetadata.proverVersion}
            </p>
          </div>
        )}

        <Button onClick={onRestart}>Start new verification</Button>
      </CardContent>
    </Card>
  );
}
