import { create } from "zustand";
import { persist } from "zustand/middleware";

type Environment = "dev" | "prod";

interface EnvironmentStore {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
}

export const useEnvironmentStore = create<EnvironmentStore>()(
  persist(
    (set) => ({
      environment: "dev",
      setEnvironment: (environment: Environment) => set({ environment }),
    }),
    {
      name: "keyring-environment-storage",
    }
  )
);
