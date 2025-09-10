import { Hexlified, circuit } from "@keyringnetwork/circuits";

export interface Policy {
  id: number;
  onchain_id: number;
  regime_key: RegimeKeySchema;
  public_key: PublicKeySchema;
  duration: number;
  cost: number;
}

export interface KeyringZKPGConfig {
  /**
   * API endpoint to get the server time
   */
  serverTimeEndpoint: string;

  /**
   * ZK artifacts CDN URLs
   */
  zkArtifacts: {
    authorisationConstruction: {
      zKey: string;
      wasm: string;
      symbolMap: string;
    };
  };

  /**
   * Time buffer for time calculations in milliseconds
   */
  timeBufferMs: number;
}

export interface KeyringZKPGOptions {
  debug?: boolean;
  useLocalTime?: boolean;
  config?: Partial<KeyringZKPGConfig>;
}

export interface KeyringZKPGInput {
  tradingWallet: string;
  policy: Policy;
  chainId: number;
}

export interface KeyringZKPGOutput {
  proof: Hexlified<any>;
  publicSignals: string[];
  witness: circuit.AuthorisationConstructionRSAWitness;
}

export interface CredentialUpdateCalldata {
  trader: string;
  onchainPolicyId: number;
  chainId: number;
  validUntil: number;
  cost: number;
  key: string;
  signature: string;
  backdoor: string;
}

export type KeyringZKPGStatus =
  | "idle"
  | "prefetching_files"
  | "generating_proof"
  | "proofs_ready"
  | "error";

export interface KeyringZKPGArtifacts {
  zKey: Uint8Array;
  wasm: Uint8Array;
  symbolMap: any;
}

export type PublicKeySchema = {
  n: string;
  e: string;
};

export type RegimeKeySchema = {
  x: string;
  y: string;
};
