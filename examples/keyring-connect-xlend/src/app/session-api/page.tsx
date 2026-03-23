import { XLendDemoPage } from "@/components/demo/XLendDemoPage";

export default function KeyringConnectSessionApiDemoPage() {
  return (
    <XLendDemoPage
      transportMode="sessionApi"
      title="xLend session-based flow"
      description="This demo mints a short-lived client token, launches the SDK session flow, and supports extension or mobile verification."
    />
  );
}
