"use client";

import Image from "next/image";
import { WalletButton } from "@/components/wallet/WalletButton";
import { NetworkSelector } from "@/components/wallet/NetworkSelector";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <div className="p-4 flex justify-between items-center min-h-[68px] group">
      <div className="flex items-center gap-8">
        <Image src="/xlend-logo.svg" alt="xLend" width={89.39} height={22.78} />
        <div className="flex items-center gap-6 ml-4">
          <span className="font-medium">Lend</span>
          <span className="font-medium">Borrow</span>
          <span className="font-medium">Portfolio</span>
        </div>
      </div>
      <div className="flex items-center gap-4 bg-white rounded-md p-2.5 relative min-w-[200px]">
        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute inset-0 p-2 z-10">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1"
            onClick={() => {
              window.open(
                "https://github.com/Keyring-Network/keyring-frontend-public/tree/master/examples/keyring-connect-xlend",
                "_blank"
              );
            }}
          >
            xLend <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1"
            onClick={() => {
              window.open(
                "https://www.npmjs.com/package/@keyringnetwork/keyring-connect-sdk",
                "_blank"
              );
            }}
          >
            SDK <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <span className="text-sm font-medium text-blue-500 group-hover:opacity-0 transition-all duration-200 w-full text-center pointer-events-none">
          View Resources
        </span>
      </div>
      <div className="flex items-center gap-3">
        <NetworkSelector />
        <WalletButton />
      </div>
    </div>
  );
}
