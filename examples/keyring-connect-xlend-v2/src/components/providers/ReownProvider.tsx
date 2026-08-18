"use client";

import {
  wagmiAdapter,
  solanaWeb3JsAdapter,
  networks,
  REOWN_PROJECT_ID,
} from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { mainnet } from "@reown/appkit/networks";

// Set up queryClient
const queryClient = new QueryClient();

// Set up metadata
const metadata = {
  name: "Keyring Network Demo",
  description: "Keyring Network Demo",
  url: "https://demo.keyring.network", //'https://github.com/0xonerb/next-reown-appkit-ssr', // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter],
  projectId: REOWN_PROJECT_ID,
  networks,
  defaultNetwork: mainnet,
  metadata,
  themeMode: "light",
  features: {
    analytics: true,
    swaps: false,
    send: false,
    email: false,
    onramp: false,
    socials: false,
    history: false,
  },
  themeVariables: {
    "--w3m-accent": "#000000",
  },
});

function ReownProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default ReownProvider;
