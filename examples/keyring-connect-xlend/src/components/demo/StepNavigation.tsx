import { InfoIcon, LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface Step {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface StepNavigationProps {
  steps: Step[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function StepNavigation({
  steps,
  activeTab,
  setActiveTab,
}: StepNavigationProps) {
  return (
    <div className="w-full border border-firefly-200 rounded-lg shadow-sm p-4">
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-md font-medium">Verification Flow</h2>
            <InfoIcon className="w-4 h-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Step through the Keyring Connect verification process for demo
            purposes. In a production use case, the Keyring Connect verification
            process would progress automatically based on the user&apos;s
            actions.
          </p>
        </TooltipContent>
      </Tooltip>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = activeTab === step.id;
          const isCompleted =
            steps.findIndex((s) => s.id === activeTab) > index;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step with connector */}
              <div className="flex flex-col items-center relative w-full">
                {/* Step circle */}
                <button
                  onClick={() => setActiveTab(step.id)}
                  className={`
                    h-10 w-10 rounded-full flex items-center justify-center z-10
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-teal shadow-md"
                        : isCompleted
                        ? "bg-teal-100 text-teal border border-teal-200"
                        : "bg-firefly-100 text-firefly-500 border border-firefly-200"
                    }
                  `}
                >
                  <StepIcon className="h-5 w-5" />
                </button>

                {/* Step label */}
                <span
                  className={`
                  mt-2 text-xs font-medium
                  ${
                    isActive
                      ? "text-primary"
                      : isCompleted
                      ? "text-teal"
                      : "text-firefly-500"
                  }
                `}
                >
                  {step.label}
                </span>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-6 left-1/2 w-full h-0.5 -translate-y-1/2">
                    <div
                      className={`h-full ${
                        isCompleted ? "bg-teal" : "bg-firefly-200"
                      }`}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
