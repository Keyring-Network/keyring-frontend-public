// Stripped down Policy type to only include the fields needed for the test app
export type Policy = {
  id: number;
  name: string;
  costs: Array<PolicyCostSchema>;
  regime_key: RegimeKeySchema;
  public_key: PublicKeySchema;
  duration: number;
};

export type PublicKeySchema = {
  n: string;
  e: string;
};

export type RegimeKeySchema = {
  x: string;
  y: string;
};

export type PolicyCostSchema = {
  chain_id: number;
  cost: number;
  policy_id: number;
};

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface BlindedSignatureRequest {
  proof: unknown;
  public_signals: string[];
}

export interface BlindedSignatureResponse {
  blinded_signature: string;
}

export interface ValidateDataRequest {
  userId: string;
  policyId: string;
  data: Record<string, unknown>;
}

export interface ValidateDataResponse {
  attestation_status: AttestationStatus;
}

export interface UserStatus {
  attestation_status: AttestationStatus;
}

export enum AttestationStatus {
  ATTESTATION_READY = "attestation_ready",
  ONBOARDING_REQUIRED = "onboarding_required",
  ONBOARDING_PENDING = "onboarding_pending",
  NON_COMPLIANT = "non_compliant",
}
