import { DEFAULT_POLICIES } from "@/config";
import type { Policy } from "@/types/keyring";
import { create } from "zustand";

interface PolicyStore {
  policy: Policy;
  setPolicy: (policy: Policy) => void;
}

export const usePolicyStore = create<PolicyStore>((set) => ({
  policy: DEFAULT_POLICIES[0],
  setPolicy: (policy) => set({ policy }),
}));
