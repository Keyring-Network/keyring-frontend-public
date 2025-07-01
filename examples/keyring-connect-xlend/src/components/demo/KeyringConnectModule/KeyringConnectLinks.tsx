import {
  ExternalLink,
  Code2,
  Github,
  BookOpen,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { usePolicyStore } from "@/hooks/store/usePolicyStore";
import { useEnvironmentStore } from "@/hooks/store/useEnvironmentStore";
import { usePolicies } from "@/hooks/usePolicies";

export const KeyringConnectLinks = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { policy, setPolicy } = usePolicyStore();
  const { environment, setEnvironment } = useEnvironmentStore();
  const { policies } = usePolicies();

  const selectedPolicy = policies.find((p) => p.id === policy.id);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 hidden xl:block ">
      <div className="relative bg-firefly text-white rounded-xl p-3 border border-blue-100 shadow-lg min-w-[250px] max-w-[280px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-teal text-firefly rounded-md flex items-center justify-center">
            <Code2 className="w-4 h-4 " />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-semibold">Keyring Connect</h3>
            <p className="text-xs ">Dev Resources</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="w-6 h-6 p-0 text-white/50 hover:bg-white"
            onClick={() => setIsVisible(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-xs text-teal hover:bg-firefly-100"
            onClick={() => {
              window.open(
                "https://github.com/Keyring-Network/keyring-frontend-public/tree/master/examples/keyring-connect-xlend",
                "_blank"
              );
            }}
          >
            <Github className="w-3 h-3" />
            <span className="flex-1 text-left">xLend Example</span>
            <ExternalLink className="w-3 h-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-xs text-teal   hover:bg-firefly-100"
            onClick={() => {
              window.open(
                "https://www.npmjs.com/package/@keyringnetwork/keyring-connect-sdk",
                "_blank"
              );
            }}
          >
            <BookOpen className="w-3 h-3" />
            <span className="flex-1 text-left">SDK Docs</span>
            <ExternalLink className="w-3 h-3" />
          </Button>

          <div className="mt-2">
            <p className="text-xs text-white/70 mb-1 mt-4">Environment</p>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full items-center p-2 justify-between flex gap-2 h-8 text-xs text-white hover:text-firefly hover:bg-firefly-100 rounded-md">
                {environment.toUpperCase()}
                <ChevronRight className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Select Environment</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setEnvironment("dev")}>
                  DEV
                  {environment === "dev" ? (
                    <div className="w-2 h-2 ml-4 bg-teal rounded-full" />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEnvironment("prod")}>
                  PROD
                  {environment === "prod" ? (
                    <div className="w-2 h-2 ml-4 bg-teal rounded-full" />
                  ) : null}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-2">
            <p className="text-xs text-white/70 mb-1 mt-4">
              Active Test Policy
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full items-center p-2 justify-between flex gap-2 h-8 text-xs text-white hover:text-firefly hover:bg-firefly-100 rounded-md">
                {selectedPolicy?.name || "Select Policy"}
                <ChevronRight className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Select Policy</DropdownMenuLabel>
                {policies.map((policy) => (
                  <DropdownMenuItem
                    key={policy.id}
                    onClick={() => setPolicy(policy)}
                  >
                    {policy.name}
                    {selectedPolicy?.id === policy.id ? (
                      <div className="w-2 h-2 ml-4 bg-teal rounded-full" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};
