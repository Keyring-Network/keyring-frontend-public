import { DEFAULT_POLICIES } from "@/config";
import { Policy } from "@/types/keyring";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PolicyStore {
  policy: Policy;
  setPolicy: (policy: Policy) => void;
}

export const usePolicyStore = create<PolicyStore>()(
  persist(
    (set) => ({
      policy: DEFAULT_POLICIES[0],
      setPolicy: (policy: Policy) => set({ policy }),
    }),
    {
      name: "keyring-policy-storage",
    }
  )
);
