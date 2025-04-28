"use client";

import Image from "next/image";
import { WalletButton } from "@/components/wallet/WalletButton";
import { NetworkSelector } from "@/components/wallet/NetworkSelector";

export function AppHeader() {
  return (
    <div className="p-4 flex justify-between items-center">
      <div className="flex items-center gap-8">
        <Image src="/xlend-logo.svg" alt="xLend" width={89.39} height={22.78} />
        <div className="flex items-center gap-6 ml-4">
          <span className="font-medium">Lend</span>
          <span className="font-medium">Borrow</span>
          <span className="font-medium">Portfolio</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NetworkSelector />
        <WalletButton />
      </div>
    </div>
  );
}
