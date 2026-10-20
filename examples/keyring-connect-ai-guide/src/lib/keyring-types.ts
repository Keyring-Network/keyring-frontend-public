export type KeyringCredentialStatus =
  | { state: "keyring:none" }
  | { state: "keyring:valid"; expiresAt: Date }
  | { state: "keyring:expired"; expiredAt: Date };

export type KeyringFlowState =
  | "loading"
  | "error"
  | "no-credential"
  | "install"
  | "start"
  | "progress"
  | "calldata-ready"
  | "transaction-pending"
  | "valid";
