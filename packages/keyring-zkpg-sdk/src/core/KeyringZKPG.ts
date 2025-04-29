import type {
  ECCryptoSuite,
  G1Point,
  Hexlified,
  SnarkJS,
} from "@keyringnetwork/circuits";
import * as circuit from "@keyringnetwork/circuits/circuit";
import * as crypto from "@keyringnetwork/circuits/crypto";
import * as domainobjs from "@keyringnetwork/circuits/domainobjs";
import { hexlifyBigInts } from "@keyringnetwork/circuits/utils";
import axios from "axios";
import { toHex } from "viem";
import { ArtifactStorage } from "../storage/ArtifactStorage";
import type {
  CredentialUpdateCalldata,
  KeyringZKPGArtifacts,
  KeyringZKPGInput,
  KeyringZKPGOptions,
  KeyringZKPGOutput,
  KeyringZKPGStatus,
  PublicKeySchema,
  RegimeKeySchema,
} from "./types";

const ZK_FILES_SOURCE = {
  authorisationConstruction: [
    "https://main.cdn.krnprod.net/AuthorisationConstruction/AuthorisationConstruction.01.zKey",
    "https://main.cdn.krnprod.net/AuthorisationConstruction/AuthorisationConstruction.wasm",
    "https://main.cdn.krnprod.net/AuthorisationConstruction/AuthorisationConstruction.public.sym.json",
  ],
};

export class KeyringZKPG {
  private static nRegimes = 5;
  private static instance: KeyringZKPG | null = null;
  private storage: ArtifactStorage;
  private status: KeyringZKPGStatus | null = null;
  private abortController: AbortController | null = null;
  private artifactsFetchPromise: Promise<KeyringZKPGArtifacts> | null = null;
  private debugMode = false;

  private constructor(
    jsCrypto: ECCryptoSuite,
    snarkJS: SnarkJS,
    options?: KeyringZKPGOptions
  ) {
    this.storage = new ArtifactStorage();
    this.debugMode = !!options?.debug;
    this.injectExternalDependencies(jsCrypto, snarkJS);
  }

  /**
   * Get or create a KeyringZKPG instance
   */
  public static async getInstance(
    ecCrypto: ECCryptoSuite,
    snarkJS: SnarkJS,
    options?: KeyringZKPGOptions
  ): Promise<KeyringZKPG> {
    if (!KeyringZKPG.instance) {
      KeyringZKPG.instance = new KeyringZKPG(ecCrypto, snarkJS, options);
      KeyringZKPG.instance.init();
      return KeyringZKPG.instance;
    }
    return KeyringZKPG.instance;
  }

  /**
   * Initialize the KeyringZKPG instance
   */
  public async init(): Promise<void> {
    this.log("init", this.status);
    if (this.status === "prefetching_files" || this.status === "idle") {
      return;
    }

    this.status = "prefetching_files";

    try {
      await this.fetchZkArtifacts();
      this.updateStatus("idle");
    } catch (error) {
      this.handleError(error, "Failed to initialize ZK engine");
    }
  }

  /**
   * Generate a ZK proof for Keyring
   */
  public async generateProof(input: KeyringZKPGInput): Promise<{
    proof: Hexlified<any>;
    publicSignals: string[];

    witness: circuit.AuthorisationConstructionWitness;
  }> {
    try {
      this.updateStatus("generating_proof");

      // Now proceed with proof generation
      const proofData = await this.generateZkProof(input);

      if (!proofData) {
        throw new Error("Failed to generate proof");
      }

      this.updateStatus("proofs_ready");

      return proofData;
    } catch (error) {
      this.handleError(error, "Failed to generate proof");
      throw error;
    }
  }

  /**
   * Get current status of the KeyringZKPG instance
   */
  public getStatus(): KeyringZKPGStatus | null {
    this.log("getStatus", this.status);
    return this.status;
  }

  private updateStatus(status: KeyringZKPGStatus): void {
    this.status = status;
  }

  private handleError(error: unknown, message: string): void {
    console.error(message, error);
    this.updateStatus("error");
  }

  private async fetchZkArtifacts(): Promise<KeyringZKPGArtifacts> {
    this.log("fetchZkArtifacts");
    if (!this.artifactsFetchPromise) {
      this.log("fetchZkArtifacts: no fetch in progress");
      // If no fetch is in progress, start one
      this.abortController = new AbortController();
      this.artifactsFetchPromise = this._fetchZkArtifacts(
        this.abortController.signal
      );
    }

    try {
      // Wait for artifacts to be loaded
      this.log("fetchZkArtifacts: waiting for artifacts");
      return await this.artifactsFetchPromise;
    } catch (error) {
      this.log("fetchZkArtifacts: fetch failed");
      // If fetch failed, clear the promise so we can try again
      this.artifactsFetchPromise = null;
      throw new Error(
        `Failed to load ZK artifacts: ${(error as Error).message}`
      );
    }
  }

  private async _fetchZkArtifacts(
    signal?: AbortSignal
  ): Promise<KeyringZKPGArtifacts> {
    try {
      this.log("Starting ZK artifacts fetching...");

      // Process authorisationConstruction artifacts
      const fileList = ZK_FILES_SOURCE.authorisationConstruction;

      // Check if we already have this artifact cached
      const cachedArtifact = await this.storage.getArtifact().catch((error) => {
        console.error("Failed to get cached ZK artifacts:", error);
        return null;
      });

      if (cachedArtifact) {
        this.log("Using cached ZK artifacts");
        return cachedArtifact;
      }

      // Fetch each file with abort signal support
      const artifactPromises = fileList.map(async (file) => {
        // Check for abort signal
        if (signal?.aborted) throw new Error("Operation aborted");

        // Determine if JSON or binary
        const isJson = file.endsWith(".json");

        try {
          const response = await axios.get(file, {
            responseType: isJson ? "json" : "arraybuffer",
            signal,
          });

          return response.data;
        } catch (error: any) {
          console.error(`Failed to fetch ${file}: ${error.message}`);
          throw error;
        }
      });

      // Wait for all files to be fetched
      const results = await Promise.all(artifactPromises);

      // Create the artifact object
      const artifact: KeyringZKPGArtifacts = {
        zKey: new Uint8Array(results[0]),
        wasm: new Uint8Array(results[1]),
        symbolMap: results[2] || null,
      };

      // Store the complete artifact
      await this.storage.storeArtifact(artifact);
      this.log("ZK artifacts successfully cached");

      return artifact;
    } catch (error: any) {
      if (signal?.aborted) {
        this.log("ZK artifacts fetch was cancelled");
        throw new Error("Operation cancelled");
      }

      console.error("Failed to prefetch ZK artifacts:", error.message);
      throw new Error("Failed to prefetch ZK artifacts");
    }
  }

  private async retrieveCircuit(): Promise<circuit.CircuitSetup> {
    try {
      const artifact = await this.fetchZkArtifacts();
      this.log("Circuit retrieved", artifact);
      if (!artifact) {
        throw new Error("KeyringZKPGArtifacts not found");
      }

      return new circuit.CircuitSetup(
        artifact.zKey,
        artifact.wasm,
        artifact.symbolMap
      );
    } catch (e) {
      throw e;
    }
  }

  private getPolicyRegimes(regimeKey: RegimeKeySchema) {
    const key = [BigInt(regimeKey.x), BigInt(regimeKey.y)] as G1Point;
    return [new domainobjs.Regime(key)];
  }

  private policyDomainObject(input: KeyringZKPGInput) {
    const { policy } = input;

    return new domainobjs.Policy(
      policy.id,
      policy.duration,
      input.chainId,
      policy.cost,
      this.getPolicyRegimes(policy.regime_key)
    );
  }

  private async generateIdentity(
    tradingWallet: string,
    policy: domainobjs.Policy,
    trapdoor?: bigint
  ) {
    try {
      const _trapdoor = trapdoor || crypto.randomValue();

      const identity = new domainobjs.Identity(
        _trapdoor,
        tradingWallet,
        policy
      );

      return identity;
    } catch (error) {
      throw new Error("Failed to generate identity");
    }
  }

  private getPolicyPublicModulus(publicKey: PublicKeySchema) {
    return BigInt(publicKey.n);
  }

  private async generateZkProof(
    input: KeyringZKPGInput
  ): Promise<KeyringZKPGOutput> {
    try {
      this.log("Generating ZK proof...");
      const policy = this.policyDomainObject(input);
      this.log("Policy generated");
      const identity = await this.generateIdentity(input.tradingWallet, policy);
      this.log("Identity generated");
      if (!identity) {
        throw new Error("Failed to generate identity");
      }

      const witness = new circuit.AuthorisationConstructionWitness(
        { nRegimes: KeyringZKPG.nRegimes },
        identity,
        this.getPolicyPublicModulus(input.policy.public_key),
        undefined,
        this.getPolicyRegimes(input.policy.regime_key)
      );
      this.log("Witness generated");
      const circuitSetup = await this.retrieveCircuit();
      this.log("Circuit setup retrieved");
      if (!circuitSetup) {
        throw new Error("Circuit setup is undefined");
      }

      const circuitProof = await circuitSetup.fullProve(witness.witnessInputs);
      this.log("Circuit proof generated");
      if (!circuitProof) {
        throw new Error("Failed to generate circuit proof");
      }

      const proof = circuit.AuthorisationConstructionProof.from(circuitProof);
      this.log("Proof generated");
      const snarkjsProof = hexlifyBigInts(
        proof.snarkjs_proof
      ) as Hexlified<any>;
      this.log("Proof hexlified");

      // Return the proof data instead of making the API call
      return {
        proof: snarkjsProof,
        publicSignals: proof.snarkjs_result.publicSignals,
        witness,
      };
    } catch (e) {
      throw e;
    }
  }

  public async createCredentialUpdateCalldata(
    blindedSignature: string,
    zkpgInput: KeyringZKPGInput,
    zkpgOutput: KeyringZKPGOutput
  ): Promise<CredentialUpdateCalldata> {
    const blindedSignatureBuffer = Buffer.from(
      blindedSignature.slice(2),
      "hex"
    );

    const { policy, tradingWallet, chainId } = zkpgInput;
    const { witness } = zkpgOutput;

    const _signature = witness.unblindSignature(blindedSignatureBuffer);
    const isValidSignature = await witness.verifySignature(_signature);

    if (!isValidSignature) {
      throw new Error("Invalid signature");
    }

    const signature = toHex(_signature);

    const authMessage = witness.authMessage;
    const validUntil = authMessage.validUntil;
    const cost = authMessage.cost;
    const backdoor = toHex(authMessage.packedRegimeEncryptions);
    const key = toHex(BigInt(policy.public_key.n));

    const calldata: CredentialUpdateCalldata = {
      trader: tradingWallet,
      policyId: policy.id,
      chainId,
      validUntil,
      cost,
      key,
      signature,
      backdoor,
    };

    return calldata;
  }

  /**
   * Inject external dependencies for crypto operations
   * This allows the consuming application to provide the crypto dependencies
   */
  private injectExternalDependencies(
    _ecCrypto: ECCryptoSuite,
    _snarkJS: SnarkJS
  ): void {
    try {
      // Import the crypto suite
      crypto.importECCryptoSuite(_ecCrypto);
      crypto.importSnarkJS(_snarkJS);

      // Verify injection worked
      if (
        !crypto.babyJub ||
        typeof crypto.babyJub.mulPointEscalar !== "function"
      ) {
        this.log(
          "KeyringZKPG: Failed to inject external dependencies properly"
        );
      } else {
        this.log("KeyringZKPG: Successfully injected external dependencies");
      }
    } catch (error) {
      this.log("KeyringZKPG: Error injecting external dependencies", error);
      throw new Error(
        `Failed to inject external dependencies: ${(error as Error).message}`
      );
    }
  }

  /**
   * Conditional logging that only outputs when debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.debugMode) {
      console.debug("%cDebug [KeyringZKPG]:", "color: #EB4577", ...args);
    }
  }

  public cleanup(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.status = "idle";
  }
}
