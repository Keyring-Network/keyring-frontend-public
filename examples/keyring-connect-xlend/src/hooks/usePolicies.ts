import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  PaginatedResponseSchema_PolicySchema,
  Policy,
  PolicyType,
} from "@/types/keyring";
import { DEFAULT_POLICIES } from "@/config";
import { useEnvironmentStore } from "./store/useEnvironmentStore";
import { usePolicyStore } from "./store/usePolicyStore";

type UsePoliciesResult = {
  policies: Policy[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

const getPolicies = async (env: "prod" | "dev") => {
  const response = await fetch(
    `https://main.api.keyring-backend.krn${env}.net/api/v1/policies/public`
  );
  return (await response.json()) as PaginatedResponseSchema_PolicySchema;
};

export const usePolicies = (): UsePoliciesResult => {
  const { environment } = useEnvironmentStore();
  const { policy, setPolicy } = usePolicyStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["policies", environment],
    queryFn: () => getPolicies(environment),
  });

  const policies =
    data?.results
      ?.filter((policy: Policy) => policy.policy_type === PolicyType.CONNECT)
      ?.map((policy: Policy) => policy) || DEFAULT_POLICIES;

  // Handle all policy selection and update logic
  useEffect(() => {
    if (policies.length > 0) {
      const selectedPolicy = policies.find((p) => p.id === policy.id);

      // Case 1: No selected policy exists in current policies
      if (!selectedPolicy) {
        setPolicy(policies[0]);
        return;
      }

      // Case 2: Public key changed (different environments have different keys)
      const publicKeyChanged =
        selectedPolicy.public_key?.n !== policy.public_key?.n;
      if (publicKeyChanged) {
        setPolicy(selectedPolicy);
        return;
      }

      // Case 3: Current policy is missing costs data but selected policy has it
      if (!policy.costs && selectedPolicy.costs) {
        setPolicy(selectedPolicy);
        return;
      }
    }
  }, [policies, policy.id, policy.public_key?.n, policy.costs, setPolicy]);

  return {
    policies,
    isLoading,
    error,
    refetch,
  };
};
