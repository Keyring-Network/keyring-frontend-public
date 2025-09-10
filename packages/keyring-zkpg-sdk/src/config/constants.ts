import { KeyringZKPGConfig } from "../core/types";

export const DEFAULT_CONFIG: KeyringZKPGConfig = {
  serverTimeEndpoint:
    "https://main.api.keyring-backend.krnprod.net/api/v1/policies/public",
  zkArtifacts: {
    authorisationConstruction: {
      zKey: "https://main.cdn.krnprod.net/AuthorisationConstruction/AuthorisationConstruction.01.zKey",
      wasm: "https://main.cdn.krnprod.net/AuthorisationConstruction/AuthorisationConstruction.wasm",
      symbolMap:
        "https://main.cdn.krnprod.net/AuthorisationConstruction/AuthorisationConstruction.public.sym.json",
    },
  },
  timeBufferMs: 6000,
} as const;
