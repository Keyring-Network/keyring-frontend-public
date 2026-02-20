import { BackendSessionResult, PartnerInfo } from "@/types";
import axios, { AxiosInstance } from "axios";

export class Api {
  private baseUrl =
    process.env.NEXT_PUBLIC_APP_API_URL || "http://localhost:8000";
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
    });
  }

  /**
   * Get a session by its ID
   * @param sessionId - The ID of the session to get
   * @returns The session
   */
  async getSession(sessionId: string): Promise<BackendSessionResult> {
    const response = await this.axiosInstance.get<BackendSessionResult>(
      `/api/sessions/${sessionId}`,
    );
    return response.data;
  }

  /**
   * Create a session
   * @param session - The session to create
   * @returns The created session
   */
  async createSession(options: {
    sessionId: string;
    sessionToken: string;
    createdAt: string;
  }): Promise<BackendSessionResult> {
    const response = await this.axiosInstance.post<BackendSessionResult>(
      `/api/sessions`,
      options,
    );
    return response.data;
  }

  /**
   * Delete a session by its ID
   * @param sessionId - The ID of the session to delete
   * @returns The deleted session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.axiosInstance.delete(`/api/sessions/${sessionId}`);
  }

  /**
   * Get partner info
   * @returns The partner info
   */
  async getPartnerInfo(): Promise<PartnerInfo> {
    const response = await this.axiosInstance.get<PartnerInfo>(`/api/partner`);
    return response.data;
  }
}
