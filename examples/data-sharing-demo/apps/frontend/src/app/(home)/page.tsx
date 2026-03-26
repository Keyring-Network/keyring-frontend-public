"use client";

import { useState } from "react";
import VerificationView from "@/app/(home)/components/VerificationView";
import FlowSelector from "@/app/(home)/components/FlowSelector";
import { usePartnerInfo } from "@/hooks/usePartnerInfo";
import IdleView from "./components/IdleView";

export default function Home() {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [datasource, setDatasource] = useState<string>("none");
  const [flowType, setFlowType] = useState<"mobile" | "extension" | null>(null);
  const [mode, setMode] = useState<"idle" | "flow_selection" | "verification">(
    "idle",
  );
  const [verificationRequest, setVerificationRequest] = useState<{
    requestedFields: string[];
    datasource: string;
  } | null>(null);

  const { partnerInfo, isLoading } = usePartnerInfo();

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((f) => f !== fieldId)
        : [...prev, fieldId],
    );
  };

  const showFlowSelectionUi = () => {
    if (selectedFields.length === 0 || datasource === "none") {
      return;
    }

    setMode("flow_selection");
  };

  const showVerificationUi = () => {
    if (!flowType || selectedFields.length === 0 || datasource === "none") {
      return;
    }

    setVerificationRequest({
      requestedFields: [...selectedFields],
      datasource: datasource,
    });
    setMode("verification");
  };

  if (mode === "verification" && verificationRequest) {
    return (
      <VerificationView
        requestedFields={verificationRequest.requestedFields}
        datasource={verificationRequest.datasource}
        flowType={flowType || "mobile"}
        onBack={() => setMode("flow_selection")}
      />
    );
  }

  if (mode === "flow_selection") {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <FlowSelector
          selectedFlow={flowType}
          onSelect={setFlowType}
          onContinue={showVerificationUi}
          onBack={() => setMode("idle")}
        />
      </div>
    );
  }

  return (
    <IdleView
      isLoading={isLoading}
      partnerInfo={partnerInfo}
      selectedFields={selectedFields}
      datasource={datasource}
      setDatasource={setDatasource}
      toggleField={toggleField}
      showFlowSelectionUi={showFlowSelectionUi}
    />
  );
}
