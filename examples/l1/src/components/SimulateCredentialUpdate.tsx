"use client";

import { CredentialUpdateCalldata } from "@keyringnetwork/keyring-zkpg-sdk";
import { useState } from "react";
import { mainnet } from "viem/chains";
import { useSimulateContract } from "wagmi";

const CREDENTIAL_UPDATE_CONTRACT_ABI = [
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
];

export const SimulateCredentialUpdate = ({
  calldata,
}: {
  calldata: CredentialUpdateCalldata;
}) => {
  const [shouldSimulate, setShouldSimulate] = useState(false);

  const {
    data: simulatedData,
    isPending,
    isError,
    failureReason,
    refetch,
  } = useSimulateContract({
    address: process.env
      .NEXT_PUBLIC_KEYRING_DEV_MAINNET_ADDRESS as `0x${string}`,
    chainId: mainnet.id,
    abi: CREDENTIAL_UPDATE_CONTRACT_ABI,
    functionName: "createCredential",
    value: BigInt(calldata.cost),
    args: [
      calldata.trader,
      calldata.policyId,
      calldata.chainId,
      calldata.validUntil,
      calldata.cost,
      calldata.key,
      calldata.signature,
      calldata.backdoor,
    ],
    query: {
      enabled: shouldSimulate,
    },
  });

  const handleSimulate = () => {
    setShouldSimulate(true);
    refetch?.();
  };

  const resetSimulation = () => {
    setShouldSimulate(false);
  };

  return (
    <div className="space-y-4">
      <pre className="p-2 bg-gray-100 rounded overflow-auto">
        {JSON.stringify(calldata, null, 2)}
      </pre>

      <div className="flex space-x-2">
        <button
          onClick={handleSimulate}
          disabled={shouldSimulate}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {shouldSimulate && !isError
            ? "Simulating..."
            : "Simulate Transaction"}
        </button>

        {shouldSimulate && !isPending && (
          <button
            onClick={resetSimulation}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
        )}
      </div>

      {shouldSimulate && !isPending && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Simulation Result:</h2>

          {isError ? (
            <div className="p-4 bg-red-100 border border-red-300 rounded">
              <h3 className="text-lg font-medium text-red-700">
                Simulation Failed
              </h3>
              <p className="text-red-600">
                {failureReason?.message || "Unknown error occurred"}
              </p>
            </div>
          ) : simulatedData ? (
            <div className="p-4 bg-green-100 border border-green-300 rounded">
              <h3 className="text-lg font-medium text-green-700">
                Simulation Successful
              </h3>
              <pre className="p-2 bg-white rounded overflow-auto mt-2">
                {JSON.stringify(
                  simulatedData,
                  (key, value) =>
                    typeof value === "bigint" ? value.toString() : value,
                  2
                )}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
