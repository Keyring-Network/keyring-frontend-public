import { Api } from "@/helpers/api";
import { PartnerInfo } from "@/types";
import { useState } from "react";

import { useEffect } from "react";

export const usePartnerInfo = () => {
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const apiClient = new Api();

  useEffect(() => {
    const doAsync = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getPartnerInfo();
        setPartnerInfo(response);
        setIsLoading(false);
      } catch (error) {
        setError(error as Error);
        console.error("Error loading partner info:", error);
        setIsLoading(false);
      }
    };
    doAsync();
  }, []);

  return { partnerInfo, error, isLoading };
};
