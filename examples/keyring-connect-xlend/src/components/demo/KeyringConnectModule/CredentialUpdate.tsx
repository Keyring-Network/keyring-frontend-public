import { Button } from "@/components/ui/button";
import { useCredentialUpdate } from "@/hooks/useCredentialUpdate";
import { CredentialData } from "@keyringnetwork/keyring-connect-sdk";

interface CredentialUpdateProps {
  calldata: CredentialData;
  onTransactionPending: () => void;
}

export const CredentialUpdate = ({
  calldata,
  onTransactionPending,
}: CredentialUpdateProps) => {
  const { writeWithWallet, isSimulating, simulationError, isWalletUpdating } =
    useCredentialUpdate({
      calldata,
      onTransactionPending,
    });

  return (
    <>
      <Button
        className="mt-3"
        disabled={!writeWithWallet || isWalletUpdating}
        onClick={writeWithWallet}
      >
        {isWalletUpdating
          ? "Pending..."
          : isSimulating
          ? "Simulating..."
          : "Sign Transaction"}
      </Button>
      {simulationError && (
        <div className="mt-3 text-red-500 text-xs max-w-sm max-h-10 overflow-y-auto">
          <p>Simulation Error: {simulationError}</p>
        </div>
      )}
    </>
  );
};
