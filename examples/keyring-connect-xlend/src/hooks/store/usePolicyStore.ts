import { create } from "zustand";

interface PolicyStore {
  policyId: number;
  setPolicyId: (id: number) => void;
}

export const usePolicyStore = create<PolicyStore>((set) => ({
  policyId: 7, // NOTE: Must be set to the same policyId used on-chain, for now hardcoded to test policy
  setPolicyId: (id: number) => set({ policyId: id }),
}));
