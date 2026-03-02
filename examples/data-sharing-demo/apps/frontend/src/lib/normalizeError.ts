import { DataSharingError } from "@keyringnetwork/data-sharing-sdk";

export function normalizeDataSharingError(err: unknown): DataSharingError {
  if (err instanceof DataSharingError) {
    return err;
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  const lower = message.toLowerCase();

  if (
    lower.includes("extension") &&
    (lower.includes("install") || lower.includes("not found"))
  ) {
    return new DataSharingError("UNKNOWN", "Keyring Extension not installed");
  }

  if (
    lower.includes("reject") ||
    lower.includes("denied") ||
    lower.includes("cancel")
  ) {
    return new DataSharingError("UNKNOWN", "Verification request was rejected");
  }

  if (lower.includes("fetch") || lower.includes("network")) {
    return new DataSharingError("UNKNOWN", "Network failure. Please retry.");
  }

  return new DataSharingError("UNKNOWN", message);
}
