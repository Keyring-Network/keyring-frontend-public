export type PolicyCostSchema = {
  chain_id: number;
  cost: number;
  policy_id: number;
};

export enum PolicyType {
  PRO = "pro",
  CONNECT = "connect",
  PRO_CONNECT = "pro_connect",
}

export type PublicKeySchema = {
  n: string;
  e: string;
};

export interface Policy {
  name: string;
  id: number;
  costs?: PolicyCostSchema[];
  policy_type?: PolicyType;
  public_key?: PublicKeySchema;
}

export type PaginatedResponseSchema_PolicySchema = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<Policy>;
};
