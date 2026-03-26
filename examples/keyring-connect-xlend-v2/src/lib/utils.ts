import { CaipNetworkId } from "@reown/appkit";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getChainIdFromCaipNetworkId = (
  caipNetworkId?: CaipNetworkId
): number | undefined => {
  const network = caipNetworkId?.split(":");
  if (!network) return undefined;

  if (network[0] === "eip155") {
    return Number(network[1]);
  }

  if (network[0] === "solana") {
    // FIXME: This is a temporary chain id until we upgraded to CAIP
    const TEMP_SOLANA_CHAIN_ID = 1915121141;
    return TEMP_SOLANA_CHAIN_ID;
  }

  return undefined;
};
