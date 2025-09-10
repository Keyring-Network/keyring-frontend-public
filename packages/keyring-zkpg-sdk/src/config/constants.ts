import { KeyringZKPGConfig } from "../core/types";

export const DEFAULT_CONFIG: KeyringZKPGConfig = {
  serverTimeEndpoint:
    "https://main.api.keyring-backend.krnprod.net/api/v1/policies/public",
  zkArtifacts: {
    authorisationConstruction: {
      zKey: "https://main.cdn.krnprod.net/circuits/4.0.1/AuthorisationConstructionRSA/AuthorisationConstructionRSA.01.zKey",
      wasm: "https://main.cdn.krnprod.net/circuits/4.0.1/AuthorisationConstructionRSA/AuthorisationConstructionRSA.wasm",
      symbolMap:
        "https://main.cdn.krnprod.net/circuits/4.0.1/AuthorisationConstructionRSA/AuthorisationConstructionRSA.public.sym.json",
    },
  },
  timeBufferMs: 6000,
} as const;
