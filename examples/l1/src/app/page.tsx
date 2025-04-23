"use client";

import { PrivateKey, babyJub, eddsa, poseidon } from "@iden3/js-crypto";
// @ts-expect-error -- no types available
import { Scalar, utils as ffutils } from "ffjavascript";
// @ts-expect-error -- no types available
import { groth16, zKey as zKeyGen } from "snarkjs";
import { NewUserForm } from "@/components/NewUserForm";
import { SimulateCredentialUpdate } from "@/components/SimulateCredentialUpdate";
import { BlindedSignatureResponse, Policy, User } from "@/types";
import {
  CredentialUpdateCalldata,
  KeyringZKPG,
} from "@keyringnetwork/keyring-zkpg-sdk";
import axios from "axios";
import { useEffect, useState } from "react";
import { mainnet } from "viem/chains";
import { SnarkJS } from "@keyringnetwork/circuits/types";

const jsCrypto = {
  poseidon,
  babyJub,
  eddsa,
  PrivateKey,
  Scalar,
  stringifyBigInts: ffutils.stringifyBigInts,
  subtleCrypto:
    typeof window !== "undefined" ? window.crypto.subtle : undefined,
};

const snarkjs: SnarkJS = {
  prove: groth16.prove,
  fullProve: groth16.fullProve,
  verify: groth16.verify,
  newZKey: zKeyGen.newZKey,
  exportVerificationKey: zKeyGen.exportVerificationKey,
  exportSolidityVerifier: zKeyGen.exportSolidityVerifier,
};

export default function SdkTestPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [keyringZKPG, setKeyringZKPG] = useState<KeyringZKPG | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isValidating, setIsValidating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingPolicies, setIsFetchingPolicies] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [tradingWallet, setTradingWallet] = useState(
    "0x1B448203909803c0C07C7D948bDfBd0080197947"
  );
  const [userData, setUserData] = useState({
    firstName: "First Name",
    lastName: "Last Name",
    email: `test-${Date.now()}@example.com`,
  });
  const [validationResult, setValidationResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [calldata, setCalldata] = useState<CredentialUpdateCalldata | null>(
    null
  );

  const isPending =
    isFetchingPolicies ||
    isFetchingUsers ||
    isCreatingUser ||
    isValidating ||
    isGenerating;

  // Step 1: Fetch policies
  const fetchPolicies = async () => {
    try {
      setIsFetchingPolicies(true);
      const response = await axios.get("/api/policies");
      setPolicies(response.data.results || []);

      // Auto-select the first policy
      if (response.data.results && response.data.results.length > 0) {
        setSelectedPolicy(response.data.results[0]);
      }
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Error fetching policies: ${errorMessage}`);
    } finally {
      setIsFetchingPolicies(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setIsFetchingUsers(true);
      const response = await axios.get("/api/users");
      setAllUsers(response.data.results || []);
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Error fetching users: ${errorMessage}`);
    } finally {
      setIsFetchingUsers(false);
    }
  };

  // Step 2: Create a user
  const createUser = async () => {
    try {
      setIsCreatingUser(true);
      const response = await axios.post("/api/users", userData);
      setUser(response.data);

      // Add the new user to the list of all users
      setAllUsers((prev) => [...prev, response.data]);

      return response.data;
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Error creating user: ${errorMessage}`);
      return null;
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Step 3: Validate user data against policy
  const validateUserData = async () => {
    if (!user || !selectedPolicy) {
      setError("User or policy not selected");
      return false;
    }

    try {
      setIsValidating(true);
      const response = await axios.post("/api/validate-data", {
        userId: user.id,
        policyId: selectedPolicy.id,
        data: {
          first_name: "First",
          last_name: "Last",
          type: "individual",
          status: "approved",
        },
      });

      setValidationResult(response.data);
      return response.data.valid;
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Error validating data: ${errorMessage}`);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const getKeyringZKPGStatus = () => {
    if (!keyringZKPG) {
      setError("KeyringZKPG not initialized");
      return;
    }

    setStatus(keyringZKPG.getStatus());
  };

  // Step 4: Generate credential update calldata
  const generateCredentialUpdateCalldata = async () => {
    setError(null);

    if (!keyringZKPG) {
      setError("KeyringZKPG not initialized");
      return;
    }

    if (!user || !selectedPolicy) {
      setError("User or policy not selected");
      return;
    }

    setIsGenerating(true);
    setCalldata(null);

    try {
      const chainId = mainnet.id;
      const costBasedOnChainId = selectedPolicy.costs.find(
        (c) => c.chain_id === chainId
      )?.cost;

      if (!costBasedOnChainId) {
        setError(`Policy does not support chain ID ${chainId}. `);
        return;
      }

      const keyringZKPGInput = {
        chainId,
        tradingWallet,
        policy: {
          ...selectedPolicy,
          cost: costBasedOnChainId,
        },
      };

      // Generate the proof using the Keyring SDK
      const keyringZKPGOutput = await keyringZKPG.generateProof(
        keyringZKPGInput
      );

      // Get blinded signature
      const res = await axios.post<BlindedSignatureResponse>(
        "/api/blinded-signature",
        {
          userId: user.id,
          proof: keyringZKPGOutput.proof,
          publicSignals: keyringZKPGOutput.publicSignals,
          policyId: selectedPolicy.id,
        }
      );

      // Process the blinded signature to get the credential update calldata
      const calldata = await keyringZKPG.createCredentialUpdateCalldata(
        res.data.blinded_signature,
        keyringZKPGInput,
        keyringZKPGOutput
      );

      setCalldata(calldata);
    } catch (e: Error | unknown) {
      const errorResponse = e as { response?: { data?: { error?: string } } };
      const errorMessage =
        errorResponse.response?.data?.error ||
        (e instanceof Error ? e.message : "Unknown error");
      setError("Error Creating Credential Update Calldata: " + errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Initialize the KeyringZKPG instance and fetch policies on component mount
  useEffect(() => {
    const initKeyringZKPG = async () => {
      try {
        const keyringZKPG = await KeyringZKPG.getInstance(jsCrypto, snarkjs, {
          debug: true,
        });
        setKeyringZKPG(keyringZKPG);
      } catch (err: Error | unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      }
    };

    initKeyringZKPG();
    fetchPolicies();
    fetchUsers();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Keyring Network x L1 Demo App</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">User Selection</h2>

          {/* User dropdown */}
          <div className="mb-4">
            <select
              className="p-2 border rounded w-full mb-2"
              value={user?.id || ""}
              onChange={(e) => {
                const selectedUser = allUsers.find(
                  (u) => u.id === e.target.value
                );
                setUser(selectedUser || null);
              }}
            >
              <option value="">Select an existing user</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <NewUserForm
            userData={userData}
            setUserData={setUserData}
            isPending={isPending}
            createUser={createUser}
          />

          <div className="mt-4">
            <h3 className="font-medium">Trading Wallet</h3>
            <input
              type="text"
              value={tradingWallet}
              onChange={(e) => setTradingWallet(e.target.value)}
              placeholder="Trading Wallet Address"
              className="p-2 border rounded w-full"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            Proof Generation Status
          </h2>
          <p className="p-2 bg-gray-100 rounded">{status || "Unknown"}</p>

          <button
            className="mt-2 bg-green-500 text-white p-2 rounded cursor-pointer"
            onClick={getKeyringZKPGStatus}
          >
            Get Keyring ZKPG Status
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Available Policies</h2>
        {policies.length > 0 ? (
          <select
            className="p-2 border rounded w-full"
            value={selectedPolicy?.id || ""}
            onChange={(e) => {
              const selected = policies.find(
                (p) => p.id.toString() === e.target.value
              );
              setSelectedPolicy(selected || null);
            }}
          >
            <option value="">Select a policy</option>
            {policies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.name}
              </option>
            ))}
          </select>
        ) : (
          <p>No policies available</p>
        )}
      </div>

      <div className="mb-6 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            className="bg-indigo-500 text-white p-2 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={validateUserData}
            disabled={isPending || !user || !selectedPolicy}
          >
            {isValidating ? "Validating..." : "Validate Data"}
          </button>

          <button
            className="bg-indigo-500 text-white p-2 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={generateCredentialUpdateCalldata}
            disabled={isPending}
          >
            {isGenerating ? "Generating..." : "Generate Credential"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="p-2 bg-red-100 text-red-800 rounded">{error}</p>
        </div>
      )}

      {user && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Selected User</h2>
          <pre className="p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}

      {validationResult && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Validation Result</h2>
          <pre className="p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(validationResult, null, 2)}
          </pre>
        </div>
      )}

      {calldata && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Credential Update Calldata</h2>
          <SimulateCredentialUpdate calldata={calldata} />
        </div>
      )}
    </div>
  );
}
