import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  PaginatedResponseSchema_PolicySchema,
  Policy,
  PolicyType,
} from "@/types/keyring";
import {
  DEFAULT_POLICIES,
  KEYRING_API_BASE_URL_DEV,
  KEYRING_API_BASE_URL_PROD,
} from "@/config";
import { useEnvironmentStore } from "./store/useEnvironmentStore";
import { usePolicyStore } from "./store/usePolicyStore";

type UsePoliciesResult = {
  policies: Policy[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

const getPolicies = async (env: "prod" | "dev") => {
  const apiUrl =
    env === "prod" ? KEYRING_API_BASE_URL_PROD : KEYRING_API_BASE_URL_DEV;

  const response = await fetch(`${apiUrl}/api/v1/policies/public`);
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
    // Only run validation when:
    // 1. API call has completed (not loading) AND we have API data
    // 2. OR API call failed/completed but we're using default policies
    const shouldValidate = (!isLoading && data) || (!isLoading && !data);

    if (shouldValidate && policies.length > 0) {
      const selectedPolicy = policies.find((p) => p.id === policy.id);

      // Case 1: No selected policy exists in current policies
      if (!selectedPolicy) {
        // Try to find the default policy in the current environment's policies
        const defaultPolicy = policies.find(
          (p) => p.id === DEFAULT_POLICIES[0].id
        );

        // If the default policy exists in this environment, use it
        // Otherwise, fall back to the first available policy
        setPolicy(defaultPolicy || policies[0]);
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
  }, [
    policies,
    policy.id,
    policy.public_key?.n,
    policy.costs,
    setPolicy,
    isLoading,
    data,
  ]);

  return {
    policies,
    isLoading,
    error,
    refetch,
  };
};
