/* eslint-disable @typescript-eslint/no-require-imports -- Match the compiled utility's CommonJS Viem error classes. */
const assert = require("node:assert/strict");
const test = require("node:test");
const {
  BaseError, ContractFunctionRevertedError, HttpRequestError,
  InsufficientFundsError, SocketClosedError, TimeoutError,
  WebSocketRequestError, encodeErrorResult, parseAbi,
} = require("viem");
const { getSimulationErrorMessage: message } = require("../.test-build/simulationError.js");

const abi = parseAbi([
  "error ErrInvalidCredential(uint256 policyId, address entity, string reason)",
  "error ErrCostNotSufficient(uint256 policyId, address entity, string reason)",
]);
const wrap = (cause) => new BaseError("Simulation failed", { cause });
const revert = (errorName, reason) => wrap(new ContractFunctionRevertedError({
  abi,
  functionName: "createCredential",
  data: encodeErrorResult({
    abi, errorName,
    args: [1n, "0x0000000000000000000000000000000000000001", reason],
  }),
}));

test("decodes every credential reason and gives relevant guidance", () => {
  const reasons = {
    EXP: /expired.*verify again/, STL: /newer credential.*Refresh/,
    BLK: /restricted.*Contact support/, BDK: /signing key.*not currently valid/,
    SIG: /couldn't validate/, VAL: /payment does not match/,
    PID: /invalid policy/, BVU: /invalid expiry/, CST: /invalid fee/,
    CHAINID: /different network/,
  };
  for (const [reason, expected] of Object.entries(reasons)) {
    assert.match(message(revert("ErrInvalidCredential", reason)), expected, reason);
  }
});

test("distinguishes a zero credential fee from EVM and Solana wallet balances", () => {
  assert.match(message(revert("ErrCostNotSufficient", "COST")), /fee is missing or zero/);
  assert.match(message(wrap(new InsufficientFundsError())), /^Insufficient funds.*Add funds/);
  assert.match(
    message("Insufficient funds: Your Solana wallet needs SOL to perform this transaction"),
    /^Insufficient funds.*Add SOL/
  );
});

test("recognizes nested transport failures and prioritizes timeouts", () => {
  const url = "https://example.invalid";
  for (const error of [
    new HttpRequestError({ url }), new WebSocketRequestError({ url }),
    new SocketClosedError({ url }),
  ]) {
    assert.match(message(wrap(error)), /Unable to reach the network/);
  }
  assert.match(
    message(wrap(new HttpRequestError({ url, cause: new TimeoutError({ url }) }))),
    /too long to respond/
  );
});

test("handles unknown and undecodable contract errors without leaking diagnostics", () => {
  for (const error of [
    ...["UNKNOWN", "toString", "__proto__"].map((reason) => revert("ErrInvalidCredential", reason)),
    new ContractFunctionRevertedError({ abi, functionName: "createCredential", data: "0x12345678" }),
  ]) {
    assert.equal(message(error), "Unable to update your credential. Please verify again or contact support.");
  }
});

test("does not interpret arbitrary error text as a contract reason", () => {
  for (const error of [new Error("EXP"), wrap(new Error("SIG")), "Simulation failed", null]) {
    assert.equal(message(error), "Unable to simulate this transaction. Please try again.");
  }
});
