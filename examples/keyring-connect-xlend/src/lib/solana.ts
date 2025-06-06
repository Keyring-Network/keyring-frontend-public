import { DEPLOYMENT_ENVIRONMENT } from "@/config";
import { BN, Program } from "@coral-xyz/anchor";
import {
  getKrnContractAddress,
  IDL_SOLANA,
  KeyringNetworkSolana,
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
 * @param connection - The Solana connection to fetch on-chain data
 * @returns Promise resolving to an array of values representing the credential data payload
 */
export const credentialUpdatePayload = async (
  credentialData: CredentialData,
  tradingAddress: PublicKey,
  connection: Connection
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

  const program = getSolanaProgram({ connection });
  const _key = await findKeyByEthAddress(key, program);
  if (!_key) {
    throw new Error(
      `Unknown signer key: ${key}. Key not found in on-chain registry.`
    );
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
 * @param key - The key as Uint8Array or Ethereum address string
 * @param program - The program instance
 * @param connection - Optional connection to fetch the key if ethAddress is provided
 * @returns Promise resolving to the PDA for the key
 */
export const getKeyMapping = async (
  key: Uint8Array | string,
  program: Program<KeyringNetworkSolana>,
  connection: Connection
): Promise<PublicKey> => {
  let _key: Uint8Array;

  if (typeof key === "string") {
    // If key is a string (Ethereum address), fetch it from on-chain registry
    if (!connection) {
      throw new Error(
        "Connection required when key is provided as Ethereum address string"
      );
    }
    const foundKey = await findKeyByEthAddress(key, program);
    if (!foundKey) {
      throw new Error(`Key not found in on-chain registry: ${key}`);
    }
    _key = foundKey;
  } else {
    // If key is a Uint8Array, use it directly
    _key = key;
  }

  const keyHash = Buffer.from(keccak_256(_key));
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

/**
 * Get PDA for key registry
 *
 * @param program - The program instance
 * @returns The PDA for the key registry
 */
export const getKeyRegistry = (program: Program<KeyringNetworkSolana>) => {
  const [keyRegistry] = PublicKey.findProgramAddressSync(
    [Buffer.from("keyring_program"), Buffer.from("active_keys")],
    program.programId
  );

  return keyRegistry;
};

/**
 * Fetch all active keys from the on-chain key registry
 *
 * @param program - The program instance
 * @returns Promise resolving to array of active keys as Uint8Arrays
 */
export const fetchActiveKeys = async (
  program: Program<KeyringNetworkSolana>
): Promise<Uint8Array[]> => {
  try {
    const keyRegistryPda = getKeyRegistry(program);
    const keyRegistryAccount = await (
      program.account as typeof program.account & {
        keyRegistry: {
          fetch: (pda: PublicKey) => Promise<{ activeKeys: Buffer[] }>;
        };
      }
    ).keyRegistry.fetch(keyRegistryPda);
    return keyRegistryAccount.activeKeys.map(
      (key: Buffer) => new Uint8Array(key)
    );
  } catch (e) {
    console.error(e, "fetchActiveKeys");
    return [];
  }
};

/**
 * Find a key in the active keys registry by its Ethereum address
 *
 * @param ethAddress - The Ethereum address to search for (e.g., '0x0be8dd812a02774335000eed8935a8164a24719f')
 * @param program - The program instance
 * @returns Promise resolving to the key as Uint8Array or null if not found
 */
export const findKeyByEthAddress = async (
  ethAddress: string,
  program: Program<KeyringNetworkSolana>
): Promise<Uint8Array | null> => {
  try {
    const activeKeys = await fetchActiveKeys(program);

    // Find the key that matches the Ethereum address
    for (const key of activeKeys) {
      const derivedEthAddress = pubKeyToEthAddress(key);
      if (derivedEthAddress.toLowerCase() === ethAddress.toLowerCase()) {
        return key;
      }
    }

    return null;
  } catch (e) {
    console.error(e, "findKeyByEthAddress");
    return null;
  }
};

/**
 * Converts a SECP256K1 public key to an Ethereum address
 *
 * @param pubKey SECP256K1 public key as Uint8Array
 * @returns Ethereum address as hex string
 *
 * @example
 * ```ts
 * const key = new Uint8Array([
 *   136, 203, 19, 215, 193, 242, 63, 59, 221, 17, 241, 125, 130, 83, 47, 209, 169,
 *   231, 117, 80, 166, 253, 164, 160, 218, 180, 156, 223, 89, 234, 23, 42, 142,
 *   73, 63, 162, 177, 209, 49, 89, 122, 148, 77, 9, 51, 204, 29, 207, 0, 122, 92,
 *   229, 156, 251, 211, 89, 216, 175, 138, 131, 221, 211, 55, 146,
 * ])
 * const ethAddress = pubKeyToEthAddress(key) // -> 0x0be8dd812a02774335000eed8935a8164a24719f
 * ```
 */
export const pubKeyToEthAddress = (pubKey: Uint8Array) => {
  // If the key is already 20 bytes (Ethereum address length), return it as is
  if (pubKey.length === 20) {
    return "0x" + Buffer.from(pubKey).toString("hex");
  }

  // Otherwise, process it as a public key
  // Remove the first byte if it's a 65-byte pubkey (with prefix)
  const key = pubKey.length === 65 ? pubKey.slice(1) : pubKey;

  // Hash the public key with keccak-256
  const hash = keccak_256(key);

  // Take the last 20 bytes
  const address = Buffer.from(hash).slice(12);

  return "0x" + address.toString("hex");
};
