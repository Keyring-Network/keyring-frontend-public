import {
  BaseError,
  ContractFunctionRevertedError,
  HttpRequestError,
  InsufficientFundsError,
  SocketClosedError,
  TimeoutError,
  WebSocketRequestError,
} from "viem";

const credentialErrorMessages: Readonly<Record<string, string>> = {
  EXP: "This verification has expired. Please verify again.",
  STL: "An equal or newer credential already exists. Refresh the page to continue.",
  BLK: "This wallet is restricted under this policy. Contact support.",
  BDK: "The signing key for this credential is not currently valid. Please verify again or contact support.",
  SIG: "We couldn't validate this credential. Please verify again or contact support.",
  VAL: "The transaction payment does not match the credential fee. Please verify again or contact support.",
  PID: "The credential contains an invalid policy. Contact support.",
  BVU: "The credential contains an invalid expiry date. Please verify again or contact support.",
  CST: "The credential contains an invalid fee. Please verify again or contact support.",
  CHAINID: "This credential was issued for a different network. Please verify again on the intended network.",
};

export function getSimulationErrorMessage(error: unknown): string {
  if (
    error instanceof BaseError &&
    error.walk((cause) => cause instanceof InsufficientFundsError)
  ) {
    return "Insufficient funds. Add funds to your wallet to cover the transaction and network fees.";
  }

  if (error instanceof BaseError) {
    const revert = error.walk(
      (cause) => cause instanceof ContractFunctionRevertedError
    );
    if (revert instanceof ContractFunctionRevertedError) {
      if (revert.data?.errorName === "ErrInvalidCredential") {
        const reason = revert.data.args?.[2];
        if (
          typeof reason === "string" &&
          Object.hasOwn(credentialErrorMessages, reason)
        ) {
          return credentialErrorMessages[reason];
        }
      }
      if (revert.data?.errorName === "ErrCostNotSufficient") {
        return "The credential fee is missing or zero. Please verify again or contact support.";
      }
      return "Unable to update your credential. Please verify again or contact support.";
    }

    if (error.walk((cause) => cause instanceof TimeoutError)) {
      return "The network took too long to respond. Please try again.";
    }
    if (
      error.walk(
        (cause) =>
          cause instanceof HttpRequestError ||
          cause instanceof WebSocketRequestError ||
          cause instanceof SocketClosedError
      )
    ) {
      return "Unable to reach the network. Please try again shortly.";
    }
  }

  // The Solana preparation hook already identifies insufficient SOL balances.
  if (typeof error === "string" && error.startsWith("Insufficient funds:")) {
    return "Insufficient funds. Add SOL to your wallet to cover the transaction and network fees.";
  }

  return "Unable to simulate this transaction. Please try again.";
}
