import { XLendDemoPage } from "@/components/demo/XLendDemoPage";

export default function KeyringConnectDemoPage() {
  return (
    <XLendDemoPage
      transportMode="chromeApi"
      title="xLend direct extension flow"
      description="This demo talks directly to the Keyring extension with Chrome messaging and no backend session."
    />
  );
}
