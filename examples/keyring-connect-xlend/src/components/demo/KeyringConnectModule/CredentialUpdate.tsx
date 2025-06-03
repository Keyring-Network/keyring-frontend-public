import { Button } from "@/components/ui/button";
import { useCredentialUpdate } from "@/hooks/useCredentialUpdate";
import { CredentialData } from "@keyringnetwork/keyring-connect-sdk";
import { useState } from "react";

interface CredentialUpdateProps {
  calldata: CredentialData;
  onTransactionPending: () => void;
}

export const CredentialUpdate = ({
  calldata,
  onTransactionPending,
}: CredentialUpdateProps) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const {
    writeWithWallet,
    refetchSimulation,
    isSimulating,
    simulationError,
    isWalletUpdating,
  } = useCredentialUpdate({
    calldata,
    onTransactionPending,
  });

  console.log({ isSimulating, simulationError, isWalletUpdating });

  const buttonText = simulationError
    ? "Retry simulation"
    : isSimulating
    ? "Simulating transaction..."
    : "Update credential";

  return (
    <>
      <Button
        className="mt-3"
        disabled={(isSimulating || !writeWithWallet) && !simulationError}
        onClick={simulationError ? refetchSimulation : writeWithWallet}
      >
        {buttonText}
      </Button>
      {simulationError && (
        <div className="mt-3 ">
          <button
            className="text-red-500 text-xs underline cursor-pointer hover:text-red-600"
            onClick={() => setShowErrorDetails(!showErrorDetails)}
          >
            {showErrorDetails
              ? "Hide error"
              : "Show transaction simulation error details"}
          </button>
          {showErrorDetails && (
            <div className="mt-2 text-red-500 text-xs max-w-sm max-h-32 overflow-y-auto border border-red-200 p-2 rounded bg-red-50">
              <p>Simulation Error: {simulationError}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};
