import type {
  ECCryptoSuite,
  G1Point,
  Hexlified,
  SnarkJS,
  SnarkJSGroth16Proof,
} from "@keyringnetwork/circuits";
import { circuit, crypto, domainobjs, utils } from "@keyringnetwork/circuits";
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
  Policy,
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
  private useLocalTime = false;

  private constructor(
    jsCrypto: ECCryptoSuite,
    snarkJS: SnarkJS,
    options?: KeyringZKPGOptions
  ) {
    this.storage = new ArtifactStorage();
    this.debugMode = !!options?.debug;
    this.useLocalTime = !!options?.useLocalTime;
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

    witness: circuit.AuthorisationConstructionRSAWitness;
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

    return [new domainobjs.Regime(key)].concat(
      Array(KeyringZKPG.nRegimes - 1).fill(
        new domainobjs.Regime([BigInt(0), BigInt(0)])
      )
    );
  }

  private async generateZkProof(
    input: KeyringZKPGInput
  ): Promise<KeyringZKPGOutput> {
    try {
      this.log("Generating ZK proof...");
      const policy = new domainobjs.Policy(
        input.policy.onchain_id,
        input.policy.duration,
        input.chainId,
        input.policy.cost,
        this.getPolicyRegimes(input.policy.regime_key)
      );
      this.log("Policy generated");

      const serverTime = this.useLocalTime
        ? this.getTimeNow()
        : await this.getServerTime();

      const validUntil = new Date(serverTime + policy.duration * 1000);

      const authMessage = new domainobjs.AuthMessageRSA(
        crypto.randomValue(),
        BigInt(input.tradingWallet),
        policy,
        validUntil,
        this.getRSAPublicKey(input.policy)
      );

      const witness = new circuit.AuthorisationConstructionRSAWitness(
        { nRegimes: KeyringZKPG.nRegimes },
        authMessage
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

      const proof =
        circuit.AuthorisationConstructionRSAProof.from(circuitProof);
      this.log("Proof generated");
      const snarkjsProof = utils.hexlifyBigInts(
        proof.snarkjs_proof
      ) as Hexlified<SnarkJSGroth16Proof>;
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
    const { policy, tradingWallet, chainId } = zkpgInput;
    const { witness } = zkpgOutput;
    const authMessage = witness.authMessage;

    const _signature = await this.getUnblindedSignature(
      authMessage,
      this.getRSAPublicKey(policy),
      blindedSignature
    );

    const calldata = {
      trader: tradingWallet,
      onchainPolicyId: policy.onchain_id,
      chainId: chainId,
      validUntil: authMessage.validUntil,
      cost: authMessage.cost,
      key: policy.public_key.n,
      signature: _signature,
      backdoor: toHex(authMessage.packedRegimeEncryptions),
    };

    return calldata;
  }

  private getRSAPublicKey(policy: Policy) {
    return new crypto.RSAPublicKey(
      BigInt(policy.public_key.n),
      BigInt(policy.public_key.e)
    );
  }

  private async getUnblindedSignature(
    authMessage: domainobjs.AuthMessageRSA,
    rsaPublicKey: crypto.RSAPublicKey,
    blindedSignature: string
  ) {
    const unblindedSignature = authMessage.unblindSignature(
      new crypto.RSAGroupElement(rsaPublicKey.modulus, BigInt(blindedSignature))
    );

    const isValidSignature = await authMessage.verifySignature(
      unblindedSignature
    );

    this.log({ message: "is valid signature", isValidSignature });

    if (!isValidSignature) throw new Error("Invalid blinded signature");

    return toHex(unblindedSignature.toBuffer());
  }

  /**
   * Get current time with a buffer subtracted
   * This helps account for network latency and clock drift
   * @param bufferMs Buffer in milliseconds to subtract (default: 6000ms = 6 seconds)
   * @returns Current time minus buffer in milliseconds
   */
  private getTimeNow(bufferMs: number = 6000): number {
    return Date.now() - bufferMs;
  }

  /**
   * Retrieves the server time from the server in milliseconds
   * @returns The server time.
   */
  private async getServerTime() {
    try {
      const response = await axios.get(
        "https://main.api.keyring-backend.krnprod.net/api/v1/policies/public"
      );

      const serverDate = response.headers.date;

      if (!serverDate) {
        this.log({
          message: "No server date found, defaulting to client time",
        });
        return this.getTimeNow();
      }

      return new Date(serverDate).getTime();
    } catch (error: any) {
      this.log({
        message: "Failed to get server time",
        error: error?.message,
      });
      return this.getTimeNow();
    }
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
