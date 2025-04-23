import {
  BlindedSignatureRequest,
  BlindedSignatureResponse,
  PaginatedResponse,
  Policy,
  User,
  ValidateDataResponse,
} from "@/types";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export class KeyringClient {
  private static instance: KeyringClient;
  private client: AxiosInstance;

  /**
   * Creates a new KeyringClient instance
   */
  constructor() {
    if (!process.env.KEYRING_API_URL || !process.env.KEYRING_API_KEY) {
      throw new Error("KEYRING_API_URL and KEYRING_API_KEY must be set");
    }

    this.client = axios.create({
      baseURL: process.env.KEYRING_API_URL,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.KEYRING_API_KEY,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(
          "Keyring API Error:",
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the singleton instance of KeyringClient
   */
  public static getInstance(): KeyringClient {
    if (!KeyringClient.instance) {
      KeyringClient.instance = new KeyringClient();
    }
    return KeyringClient.instance;
  }

  /**
   * Get all policies with pagination
   */
  async getPolicies(
    page = 1,
    pageSize = 100
  ): Promise<PaginatedResponse<Policy>> {
    const response = await this.client.get<PaginatedResponse<Policy>>(
      `/api/l1/policies?page=${page}&page_size=${pageSize}`
    );
    return response.data;
  }

  /**
   * Get a specific policy by ID
   */
  async getPolicy(policyId: string): Promise<Policy> {
    const response = await this.client.get<Policy>(
      `/api/l1/policies/${policyId}`
    );
    return response.data;
  }

  /**
   * Create a new user
   */
  async createUser(
    email: string,
    firstName: string,
    lastName: string
  ): Promise<User> {
    const response = await this.client.post<User>("/api/l1/users", {
      email,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data;
  }

  /**
   * Get all users with pagination
   */
  async getUsers(page = 1, pageSize = 100): Promise<PaginatedResponse<User>> {
    const response = await this.client.get<PaginatedResponse<User>>(
      `/api/l1/users?page=${page}&page_size=${pageSize}`
    );
    return response.data;
  }

  /**
   * Get a specific user by ID
   */
  async getUser(userId: string): Promise<User> {
    const response = await this.client.get<User>(`/api/l1/users/${userId}`);
    return response.data;
  }

  /**
   * Validate data against a policy schema
   * @param userId - The user ID
   * @param policyId - The policy ID
   * @param data - The data object containing user information
   */
  async validateData(
    userId: string,
    policyId: string,
    data: Record<string, unknown>
  ): Promise<ValidateDataResponse> {
    const response = await this.client.post<ValidateDataResponse>(
      `/api/l1/users/${userId}/policies/${policyId}/validate-data`,
      data
    );
    return response.data;
  }

  /**
   * Get a blinded signature for a user and policy
   */
  async getBlindedSignature(
    userId: string,
    policyId: string,
    data: BlindedSignatureRequest
  ): Promise<BlindedSignatureResponse> {
    const response = await this.client.post<BlindedSignatureResponse>(
      `/api/l1/users/${userId}/policy/${policyId}/get-blinded-signature`,
      {
        proof: data.proof,
        public_signals: data.public_signals,
      }
    );
    return response.data;
  }

  /**
   * Generic method to make custom requests to the API
   */
  async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request<T>(config);
  }
}

// Export a default instance for easy import
export default KeyringClient.getInstance();
