import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FlowType = "mobile" | "extension";

interface FlowSelectorProps {
  selectedFlow: FlowType | null;
  onSelect: (flow: FlowType) => void;
  onContinue: () => void;
  onBack: () => void;
}

const flowOptions: Array<{
  id: FlowType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: "mobile",
    title: "Mobile App",
    description: "Show a QR code and continue verification in the Keyring mobile app.",
    icon: "M",
  },
  {
    id: "extension",
    title: "Browser Extension",
    description: "Launch the Keyring browser extension and complete verification inline.",
    icon: "E",
  },
];

export default function FlowSelector({
  selectedFlow,
  onSelect,
  onContinue,
  onBack,
}: FlowSelectorProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Choose verification flow</CardTitle>
        <CardDescription>
          Select how the user should complete this verification request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {flowOptions.map((option) => {
            const isSelected = selectedFlow === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                aria-pressed={isSelected}
                className={cn(
                  "group rounded-xl border-2 p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                  isSelected
                    ? "border-sky-500 bg-sky-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-sky-300 hover:shadow",
                )}
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white group-hover:scale-105 group-hover:transition-transform">
                  {option.icon}
                </div>
                <p className="text-base font-semibold text-slate-900">{option.title}</p>
                <p className="mt-1 text-sm text-slate-600">{option.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onContinue} disabled={!selectedFlow}>
            Continue to verification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
