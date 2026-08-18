import { networks } from "@/config";

export const createBlockExplorerAction = (txHash: string, chainId?: number) => {
  if (!txHash) return undefined;

  const network = networks.find((network) => Number(network.id) === chainId);
  const explorerUrl =
    network?.blockExplorers?.default.url || "https://etherscan.io";

  return {
    label: "Inspect",
    onClick: () => {
      window.open(`${explorerUrl}/tx/${txHash}`, "_blank");
    },
  };
};
