"use client";

import { useEffect, useRef } from "react";
import { DataSharingError, DataSharingSDK } from "@keyringnetwork/data-sharing-sdk";

interface UseSdkSessionParams {
  requestedFields: string[];
  datasourceId: string;
  onInvalidConfig: (error: DataSharingError) => void;
}

export function useSdkSession({
  requestedFields,
  datasourceId,
  onInvalidConfig,
}: UseSdkSessionParams) {
  const sdkRef = useRef<DataSharingSDK | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_KEYRING_API_KEY;
    if (!apiKey) {
      onInvalidConfig(
        new DataSharingError("INVALID_CONFIG", "API key not configured"),
      );
      return;
    }

    sdkRef.current = new DataSharingSDK({
      apiKey,
      baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "",
      debug: process.env.NODE_ENV === "development",
      requestedFields,
      datasourceId,
    });
  }, [datasourceId, onInvalidConfig, requestedFields]);

  return { sdkRef };
}
