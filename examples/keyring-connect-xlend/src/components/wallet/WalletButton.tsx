"use client";

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { useWalletModalStore } from "@/hooks/store/useWalletModalStore";
import { useEffect } from "react";
import { useState } from "react";

export function WalletButton() {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWalletModalStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <Button
        variant="outline"
        className="rounded-full border-blue-500 text-blue-500 flex items-center gap-2"
        onClick={() => disconnect()}
      >
        <Wallet className="h-4 w-4 mr-2" />
        {formatAddress(address || "")}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="rounded-full border-blue-500 text-blue-500 flex items-center gap-2"
      onClick={open}
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect wallet
    </Button>
  );
}
