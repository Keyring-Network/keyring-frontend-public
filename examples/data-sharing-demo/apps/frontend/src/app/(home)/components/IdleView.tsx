import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PartnerInfo } from "@/types";

interface IdleViewProps {
  isLoading?: boolean;
  partnerInfo: PartnerInfo | null;
  selectedFields: string[];
  datasource: string;
  setDatasource: (datasource: string) => void;
  toggleField: (fieldId: string) => void;
  showFlowSelectionUi: () => void;
}

export default function IdleView({
  isLoading,
  partnerInfo,
  selectedFields,
  datasource,
  setDatasource,
  toggleField,
  showFlowSelectionUi,
}: IdleViewProps) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          Keyring Data Sharing
        </h1>
        <p className="text-xl text-slate-600">
          Verify user data with cryptographic proofs
        </p>
      </div>

      {isLoading && (
        <div className="mb-6 space-y-4" aria-label="Loading partner info">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}

      {partnerInfo && (
        <Card>
          <CardContent>
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Fields to request
              </h2>
              <p className="text-slate-600 mb-6">
                Choose the verified fields you want to request from the user
              </p>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {partnerInfo?.allowed_fields.map((field) => (
                  <label
                    key={field.id}
                    className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 focus-within:ring-2 focus-within:ring-sky-500"
                    style={{
                      borderColor: selectedFields.includes(field.id)
                        ? "#0ea5e9"
                        : "#e5e7eb",
                      backgroundColor: selectedFields.includes(field.id)
                        ? "#f0f9ff"
                        : "white",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.id)}
                      onChange={() => toggleField(field.id)}
                      aria-label={`Select ${field.label}`}
                      className="mt-1 h-5 w-5 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-slate-900">
                        {field.label}
                      </div>
                      <div className="text-sm text-slate-500">
                        {field.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Datasource
              </h2>
              <p className="text-slate-600 mb-4">Specify a datasource</p>

              <select
                value={datasource}
                onChange={(e) => setDatasource(e.target.value)}
                aria-label="Select datasource"
                className="w-full rounded-lg border border-slate-300 p-3 focus:border-sky-500 focus:ring-2 focus:ring-sky-500"
              >
                <option key="Select a datasource" value="none">
                  Select a datasource
                </option>
                {partnerInfo?.allowed_datasources.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              className="w-full"
              size="lg"
              disabled={selectedFields.length === 0 || datasource === "none"}
              onClick={showFlowSelectionUi}
            >
              Continue
            </Button>

            {selectedFields.length === 0 && datasource === "none" && (
              <p className="text-center text-red-500 mt-3 text-sm" role="alert">
                Please select at least one field and a datasource
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!partnerInfo && !isLoading && (
        <Alert className="animate-shake border-red-200 bg-red-50">
          <AlertTitle className="text-red-900">
            Error loading partner info
          </AlertTitle>
          <AlertDescription className="space-y-2 text-red-700">
            Please try again later If the problem persists, please contact
            support
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-12 text-center text-slate-500 text-sm">
        <p>Powered by Keyring Network</p>
      </div>
    </div>
  );
}
