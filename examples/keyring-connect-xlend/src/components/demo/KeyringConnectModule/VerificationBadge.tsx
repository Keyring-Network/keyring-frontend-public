import { FlowState } from "@/app/page";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import Image from "next/image";
interface VerificationBadgeProps {
  flowState: FlowState | null;
  credentialExpired: boolean;
}

export const VerificationBadge = ({
  flowState,
  credentialExpired,
}: VerificationBadgeProps) => {
  const isVerified = flowState === "valid";
  const isLoading = flowState === "loading";

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="w-full flex justify-start mb-6">
          <Badge
            variant="outline"
            className={cn(
              "bg-white rounded-full px-4 py-1 flex items-center gap-1 ",
              {
                "bg-green-100 text-green-800 border-green-200": isVerified,
                "bg-firefly-100 text-firefly border-firefly-500":
                  credentialExpired,
              }
            )}
          >
            {!flowState
              ? "Permissioned by Keyring"
              : isLoading
              ? "Checking..."
              : isVerified
              ? "Access Granted"
              : credentialExpired
              ? "Access Expired"
              : "Verification Required"}
            {isVerified && (
              <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center ml-1">
                <Image
                  src="/keyring-icon.jpg"
                  alt="Keyring Icon"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
            )}
            {!isVerified && !isLoading && (
              <div className="h-5 w-5 bg-gray-300 rounded-full flex items-center justify-center ml-1">
                <Image
                  src="/keyring-icon.jpg"
                  alt="Keyring Icon"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              </div>
            )}
            {isLoading && <Loader className="h-3 w-3 animate-spin" />}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Access to this feature is permissioned on-chain by Keyring Network.
        </p>
      </TooltipContent>
    </Tooltip>
  );
};
