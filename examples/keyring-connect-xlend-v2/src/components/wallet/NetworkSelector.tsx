import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { useEffect } from "react";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { networks } from "@/config";

export function NetworkSelector() {
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useAppKitAccount();
  const { caipNetwork, caipNetworkId, switchNetwork } = useAppKitNetwork();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isConnected || !isMounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full bg-blue-500 text-white border-blue-500 flex items-center gap-2"
        >
          {caipNetwork?.name || "Select Network"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {networks.map((network) => (
          <DropdownMenuItem
            key={network.id}
            disabled={caipNetworkId === network.id}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => switchNetwork(network)}
          >
            <span>{network.name}</span>
            {caipNetworkId === network.id && (
              <Check className="h-4 w-4 text-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
