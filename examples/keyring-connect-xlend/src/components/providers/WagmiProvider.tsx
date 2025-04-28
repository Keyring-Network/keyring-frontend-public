"use client";

import { ReactNode } from "react";
import { WagmiProvider as WagmiProviderOriginal } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { holesky, mainnet } from "wagmi/chains";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [mainnet, holesky],
  transports: {
    [mainnet.id]: http(),
    [holesky.id]: http(),
  },
  connectors: [injected()],
});

interface WagmiProviderProps {
  children: ReactNode;
}

export function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <WagmiProviderOriginal config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProviderOriginal>
  );
}
