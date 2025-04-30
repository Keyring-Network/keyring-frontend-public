import { useState } from "react";
import { useAccount, useSwitchChain, useChainId, useChains } from "wagmi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { useEffect } from "react";

export function NetworkSelector() {
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useAccount();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const chainId = useChainId();
  const chains = useChains();

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
          disabled={isSwitchPending}
        >
          {isSwitchPending
            ? "Switching..."
            : chains.find((chain) => chain.id === chainId)?.name ||
              "Select Network"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {chains.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            disabled={chainId === chain.id}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => switchChain({ chainId: chain.id })}
          >
            <span>{chain.name}</span>
            {chainId === chain.id && (
              <Check className="h-4 w-4 text-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
