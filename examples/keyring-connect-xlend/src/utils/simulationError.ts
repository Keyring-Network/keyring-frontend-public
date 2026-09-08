import { BaseError, InsufficientFundsError } from "viem";

export function getSimulationErrorMessage(error: unknown): string {
  if (
    error instanceof BaseError &&
    error.walk((cause) => cause instanceof InsufficientFundsError)
  ) {
    return "Insufficient funds. Add funds to your wallet to cover the transaction and network fees.";
  }

  // The Solana preparation hook already identifies insufficient SOL balances.
  if (typeof error === "string" && error.startsWith("Insufficient funds:")) {
    return "Insufficient funds. Add SOL to your wallet to cover the transaction and network fees.";
  }

  return "Unable to simulate this transaction. Please try again.";
}
