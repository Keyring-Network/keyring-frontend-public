"use client";

import { AppHeader } from "@/components/demo/XLendAppInterface/AppHeader";
import { LendingFormMock } from "@/components/demo/XLendAppInterface/LendingFormMock";
import { Card, CardContent } from "@/components/ui/card";
import { LendingTabsMock } from "@/components/demo/XLendAppInterface/LendingTabsMock";
import dynamic from "next/dynamic";

const KeyringConnectModuleNoSSR = dynamic(
  () =>
    import("@/components/demo/KeyringConnectModule/index").then((mod) => ({
      default: mod.KeyringConnectModule,
    })),
  { ssr: false }
);

export default function KeyringConnectDemo() {
  return (
    <div className="bg-blue-100/50 h-full">
      <AppHeader />
      <div className="flex justify-center items-center py-8 px-4">
        <div className="w-full max-w-xl">
          <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
            <CardContent className="p-4 pb-0">
              <LendingTabsMock />
              <LendingFormMock activeTab="install" />

              <KeyringConnectModuleNoSSR policyId={7} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
