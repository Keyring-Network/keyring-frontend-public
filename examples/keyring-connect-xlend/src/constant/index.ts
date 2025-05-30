import {
  arbitrum,
  avalanche,
  base,
  holesky,
  optimism,
  zksync,
  mainnet,
  polygon,
} from "wagmi/chains";

export const KEYRING_CONTRACT_ADDRESSES = {
  prod: {
    [mainnet.id]: "0xD18d17791f2071Bf3C855bA770420a9EdEa0728d",
    [optimism.id]: "0x88e097C960aD0239B4eEC6E8C5B4f74f898eFdA3",
    [arbitrum.id]: "0x88e097C960aD0239B4eEC6E8C5B4f74f898eFdA3",
    [base.id]: "0x88e097C960aD0239B4eEC6E8C5B4f74f898eFdA3",
    [zksync.id]: "0x617534538624ae12AC8F5A12cbC22491FED7D63D",
    [avalanche.id]: "0x88e097C960aD0239B4eEC6E8C5B4f74f898eFdA3",
    [polygon.id]: "0x88e097C960aD0239B4eEC6E8C5B4f74f898eFdA3",
  },
  dev: {
    [mainnet.id]: "0x2eb474cffabca358d9fd3f1d43ad2b2dfb809b0e",
    [optimism.id]: "0x292f87b46d36db555802d9b444716645053a1963",
    [arbitrum.id]: "0x1c7b604a7d738ecbb0f5e44718ade4bc58a454aa",
    [base.id]: "0x357c67a218dcf4d93189a6c4fd8483d5396d643d",
    [zksync.id]: "0x997D1fEec48907675fcA3Ad47962B571c534419D",
    [avalanche.id]: "0x8a16f136121fd53b5c72c3414b42299f972c9c67",
    [polygon.id]: "0x8a16f136121fd53b5c72c3414b42299f972c9c67",
    [holesky.id]: "0x53370173a6939f0538d0fb0f7cc653e53bf9801a",
  },
};
export const KEYRING_CONTRACT_ABI = [
  {
    type: "function",
    name: "checkCredential",
    stateMutability: "view",
    inputs: [
      { name: "entity_", type: "address" },
      { name: "policyId", type: "uint32" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tradingAddress",
        type: "address",
      },
      { internalType: "uint256", name: "policyId", type: "uint256" },
      { internalType: "uint256", name: "chainId", type: "uint256" },
      { internalType: "uint256", name: "validUntil", type: "uint256" },
      { internalType: "uint256", name: "cost", type: "uint256" },
      { internalType: "bytes", name: "key", type: "bytes" },
      { internalType: "bytes", name: "signature", type: "bytes" },
      { internalType: "bytes", name: "backdoor", type: "bytes" },
    ],
    name: "createCredential",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  ,
] as const;

/*
 {
    "inputs": [
      {
        "internalType": "address",
        "name": "tradingAddress",
        "type": "address"
      },
      { "internalType": "uint256", "name": "policyId", "type": "uint256" },
      { "internalType": "uint256", "name": "chainId", "type": "uint256" },
      { "internalType": "uint256", "name": "validUntil", "type": "uint256" },
      { "internalType": "uint256", "name": "cost", "type": "uint256" },
      { "internalType": "bytes", "name": "key", "type": "bytes" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" },
      { "internalType": "bytes", "name": "backdoor", "type": "bytes" }
    ],
    "name": "createCredential",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
*/

// NOTE: We take the dev address for testing purposes, as the connect verification is not valid for prod a
export const getKeyringContractAddress = (chainId?: number) => {
  switch (chainId) {
    case mainnet.id:
      return KEYRING_CONTRACT_ADDRESSES.dev[mainnet.id];
    case holesky.id:
      return KEYRING_CONTRACT_ADDRESSES.dev[holesky.id];
    default:
      return "0x0000000000000000000000000000000000000000";
  }
};
