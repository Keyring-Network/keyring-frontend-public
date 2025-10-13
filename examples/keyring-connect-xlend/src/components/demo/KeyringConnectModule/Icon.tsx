import { ShieldCheck, UserIcon } from "lucide-react";
import { FlowState } from "@/app/page";

export function Icon({ flowState }: { flowState: FlowState }) {
  const renderIcon = () => {
    switch (flowState) {
      case "no-credential":
        return (
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-gray-500" />
          </div>
        );
      case "progress":
        return (
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin border-blue-500"></div>
            <UserIcon className="h-6 w-6 text-gray-500" />
          </div>
        );
      case "valid":
        return (
          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </div>
        );
    }
  };

  return <div className="flex-shrink-0">{renderIcon()}</div>;
}
