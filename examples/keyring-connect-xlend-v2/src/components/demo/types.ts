export type FlowState =
  | "loading"
  | "error"
  | "no-credential"
  | "progress"
  | "calldata-ready"
  | "transaction-pending"
  | "valid";

export type DemoTransportMode = "chromeApi" | "sessionApi";
