import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
  isPolicyResolved: boolean;
  error: Error | null;
  refetch: () => void;
};

const getPolicies = async (env: "prod" | "dev") => {
  const devUrl =
    process.env.NEXT_PUBLIC_KEYRING_API_BASE_URL ??
    "https://main.api.keyring-backend.krndev.net";
  const prodUrl = "https://main.api.keyring-backend.krnprod.net";
  const response = await fetch(
    `${env === "prod" ? prodUrl : devUrl}/api/v1/policies/public`,
  );
  if (!response.ok) throw new Error("Unable to load policies.");
  return (await response.json()) as PaginatedResponseSchema_PolicySchema;
};

export const usePolicies = (initialPolicyId?: number): UsePoliciesResult => {
  const { environment } = useEnvironmentStore();
  const { policy, setPolicy } = usePolicyStore();
  const pendingPolicyId = useRef(initialPolicyId);
  const [isPolicyResolved, setIsPolicyResolved] = useState(initialPolicyId === undefined);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["policies", environment],
    queryFn: () => getPolicies(environment),
  });

  const policies =
    data?.results
      ?.filter(
        (policy: Policy) =>
          policy.policy_type === PolicyType.CONNECT ||
          policy.policy_type === PolicyType.PRO_CONNECT
      )
      ?.map((policy: Policy) => policy) || DEFAULT_POLICIES;

  // Handle all policy selection and update logic
  useEffect(() => {
    // Only run validation when:
    // 1. API call has completed (not loading) AND we have API data
    // 2. OR API call failed/completed but we're using default policies
    const shouldValidate = (!isLoading && data) || (!isLoading && !data);

    if (pendingPolicyId.current !== undefined) {
      // Wait for the requested environment's policies, not the local fallback.
      if (!data || policies.length === 0) return;
      const requested = policies.find((p) => p.id === pendingPolicyId.current);
      const fallback = policies.find((p) => p.id === DEFAULT_POLICIES[0].id) ?? policies[0];
      if (!requested) toast.error("The requested policy is unavailable in this environment. Using the default policy.");
      const selected = requested ?? fallback;
      pendingPolicyId.current = undefined;
      setPolicy(selected);
      // Publish resolution only after the requested policy or validated fallback is active.
      setIsPolicyResolved(true);
      return;
    }

    if (shouldValidate && policies.length > 0) {
      const selectedPolicy = policies.find((p) => p.id === policy.id);

      // Case 1: No selected policy exists in current policies
      if (!selectedPolicy) {
        // Try to find the default policy in the current environment's policies
        const defaultPolicy = policies.find(
          (p) => p.id === DEFAULT_POLICIES[0].id,
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
    isPolicyResolved,
    error: error ?? (data && policies.length === 0 ? new Error("No policies available.") : null),
    refetch,
  };
};
