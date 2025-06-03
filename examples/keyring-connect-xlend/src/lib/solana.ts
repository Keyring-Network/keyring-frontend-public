import { DEPLOYMENT_ENVIRONMENT } from "@/config";
import { BN, Program } from "@coral-xyz/anchor";
import {
  getKrnContractAddress,
  IDL_SOLANA,
  KeyringNetworkSolana,
  REGISTERED_SOLANA_KEYS,
  SupportedChainIds,
} from "@keyringnetwork/contracts-abi";
import { CredentialData } from "@keyringnetwork/keyring-connect-sdk";
import { keccak_256 } from "@noble/hashes/sha3";
import { Connection, PublicKey } from "@solana/web3.js";

interface GetProgramParams {
  connection: Connection;
}

/**
 * Returns an instance of the Solana program
 *
 * @param connection - The Solana connection
 * @returns An instance of the Solana program
 */
export const getSolanaProgram = ({
  connection,
}: GetProgramParams): Program<KeyringNetworkSolana> => {
  const address = getKrnContractAddress({
    chainId: SupportedChainIds.SOLANA,
    env: DEPLOYMENT_ENVIRONMENT, // NOTE: only for development purposes, env should be removed in production
  });
  const programId = new PublicKey(address);
  return new Program<KeyringNetworkSolana>(IDL_SOLANA, programId, {
    connection,
  });
};

/**
 * Converts a credential data object to an array of buffers for Solana transactions
 *
 * @param credentialData - The credential data object containing credential details
 * @param tradingAddress - The trading address as a Solana PublicKey
 * @returns An array of values representing the credential data payload
 */
export const credentialUpdatePayload = (
  credentialData: CredentialData,
  tradingAddress: PublicKey
) => {
  const { policyId, chainId, validUntil, cost, backdoor, key, signature } =
    credentialData;

  if (
    !tradingAddress ||
    !policyId ||
    !chainId ||
    !validUntil ||
    !cost ||
    !backdoor ||
    !key ||
    !signature
  ) {
    console.error("credentialUpdatePayload::missingRequiredFields", {
      credentialData,
      tradingAddress,
    });
    throw new Error("Missing required fields");
  }

  const _key = REGISTERED_SOLANA_KEYS[key];
  if (!_key) {
    throw new Error("Unknown signer key");
  }

  return [
    Buffer.from(_key),
    new BN(Number(policyId)),
    tradingAddress,
    Buffer.from(signature.slice(2), "hex"),
    new BN(validUntil),
    new BN(cost),
    Buffer.from(backdoor.slice(2), "hex"),
  ] as const;
};

/**
 * Get PDA for key mapping (e.g.7R94CmuM4A7tHCqpP7ZRzYHGsbK7sptRrQwXLJwW9Dmm)
 *
 * @param key - The key of the registered key (resigner)
 * @param program - The program instance
 * @returns The PDA for the key
 */
export const getKeyMapping = (
  key: string,
  program: Program<KeyringNetworkSolana>
) => {
  const _key = REGISTERED_SOLANA_KEYS[key];
  const keyHash = Buffer.from(keccak_256(new Uint8Array(_key)));
  const [keyMapping] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("keyring_program"),
      Buffer.from("_key_mapping"),
      keyHash.slice(0, 32),
    ],
    program.programId
  );

  return keyMapping;
};

/**
 * Get PDA for entity mapping
 *
 * @param policyId - The policy ID (e.g. 1)
 * @param trader - The trader's public key
 * @param program - The program instance
 * @returns The PDA for the entity
 */
export const getEntityMapping = (
  policyId: number,
  trader: PublicKey,
  program: Program<KeyringNetworkSolana>
) => {
  const _policyId = new BN(policyId);

  const [entityMapping] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("keyring_program"),
      Buffer.from("_entity_mapping"),
      _policyId.toArrayLike(Buffer, "le", 8),
      trader.toBuffer(),
    ],
    program.programId
  );

  return entityMapping;
};

export const getProgramState = (program: Program<KeyringNetworkSolana>) => {
  const [programState] = PublicKey.findProgramAddressSync(
    [Buffer.from("keyring_program"), Buffer.from("global_state")],
    program.programId
  );

  return programState;
};

/**
 * Get entity expiration time
 *
 * @param policyId - The policy ID (e.g. 1)
 * @param trader - The trader's public key
 * @param connection - The Solana connection
 */
export const getEntityExp = (
  policyId: number,
  trader: PublicKey,
  connection: Connection
) => {
  try {
    const program = getSolanaProgram({ connection });
    const entityMapping = getEntityMapping(policyId, trader, program);
    const entityExp = program.account.entityData.fetch(entityMapping);
    return entityExp;
  } catch (e) {
    console.error("getEntityExp", e);
    return null;
  }
};
