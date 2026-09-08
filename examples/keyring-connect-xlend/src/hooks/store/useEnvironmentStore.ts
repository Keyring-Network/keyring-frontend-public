import { create } from "zustand";

type Environment = "dev" | "prod";

interface EnvironmentStore {
  environment: Environment;
  setEnvironment: (environment: Environment) => void;
}

export const useEnvironmentStore = create<EnvironmentStore>((set) => ({
  environment: "dev",
  setEnvironment: (environment) => set({ environment }),
}));
