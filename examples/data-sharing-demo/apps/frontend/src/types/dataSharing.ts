import {
  ProofMetadata,
  Session,
  SessionStatus,
  DataSharingError,
} from "@keyringnetwork/data-sharing-sdk";

export interface BackendSessionResult {
  sessionId: string;
  error?: string;
  proofMetadata?: ProofMetadata;
  verifiedData?: Record<string, unknown>;
}

export type DataSharingFlowType = "mobile" | "extension";

export interface UseDataSharingOptions {
  requestedFields: string[];
  datasourceId: string;
  onComplete?: (data: BackendSessionResult) => void;
  onError?: (error: DataSharingError) => void;
}

export interface UseDataSharingReturn {
  session: Session | null;
  status: SessionStatus | null;
  result: BackendSessionResult | null;
  error: DataSharingError | null;
  isLoading: boolean;
  startVerification: () => Promise<void>;
  flowType: DataSharingFlowType | null;
  setFlowType: (type: DataSharingFlowType) => void;
  launchExtension: () => Promise<void>;
  cleanupSession: () => Promise<void>;
  reset: () => void;
}
