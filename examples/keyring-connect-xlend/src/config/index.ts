import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import {
  mainnet,
  arbitrum,
  solana,
  base,
  optimism,
  avalanche,
  polygon,
} from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { Policy } from "@/types/keyring";

// Get projectId from https://cloud.reown.com
export const REOWN_PROJECT_ID =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  "b56e18d47c72ab683b10814fe9495694"; // this is a public projectId only to use on localhost

export const networks = [
  mainnet,
  arbitrum,
  solana,
  base,
  optimism,
  avalanche,
  polygon,
] as [AppKitNetwork, ...AppKitNetwork[]];

//Set up the Wagmi Adapter (Config)
// wagmi 2.x and the adapter's bundled @wagmi/core 3.x type this storage with different
// generics; the objects are structurally identical, so bridge the nominal mismatch.
type AdapterStorage = ConstructorParameters<typeof WagmiAdapter>[0]["storage"];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }) as AdapterStorage,
  ssr: true,
  projectId: REOWN_PROJECT_ID,
  networks,
});

export const solanaWeb3JsAdapter = new SolanaAdapter();

export const config = wagmiAdapter.wagmiConfig;

// Public guide for the proof-data API this demo previews. Route is root-level in
// the docs app; adjust the host here if the docs are served elsewhere.
export const DATA_SHARING_DOCS_URL =
  "https://docs.keyring.network/connect/data-sharing";

export const DEFAULT_POLICIES: Policy[] = [
  {
    name: "Keyring Connect Test",
    id: 7,
    data_sharing_access_mode: "disabled",
    onchain_id: 7,
  },
];
