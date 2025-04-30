"use client";

import { Button } from "@/components/ui/button";
import { X, Wallet, Loader } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { Connector } from "wagmi";
import { useWalletModalStore } from "@/hooks/store/useWalletModalStore";
import { useEffect } from "react";
import Image from "next/image";
export function WalletModal() {
  const { isOpen, close } = useWalletModalStore();
  const { connect, connectors, isPending } = useConnect({});
  const { isConnected } = useAccount();

  const connectWithConnector = (connector: Connector) => {
    connect({ connector });
    // We'll keep the modal open until connection succeeds or fails
  };

  useEffect(() => {
    if (isConnected) {
      close();
    }
  }, [isConnected, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {isPending ? "Connecting..." : "Connect Wallet"}
          </h3>
          {!isPending && (
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isPending ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">
              Please confirm the connection in your wallet...
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  variant="outline"
                  className="w-full justify-start text-left h-14 px-4"
                  onClick={() => connectWithConnector(connector)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {connector.icon ? (
                        <img
                          src={connector.icon}
                          alt={connector.name}
                          width={20}
                          height={20}
                        />
                      ) : (
                        <Wallet className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="font-medium">{connector.name}</div>
                  </div>
                </Button>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              By connecting your wallet, you agree to our Terms of Service and
              Privacy Policy.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
