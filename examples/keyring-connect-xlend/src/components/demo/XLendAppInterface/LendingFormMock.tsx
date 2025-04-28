import { Input } from "@/components/ui/input";
import { ChevronDown, ArrowDown, CoinsIcon, Coins } from "lucide-react";

export function LendingFormMock({ activeTab }: { activeTab: string }) {
  // Static values for demo
  const ethAmount = "1";
  const tokenAmount = "0";

  return (
    <div className="space-y-4 mb-6">
      {/* You Pay Section */}
      <div className="space-y-2">
        <div className="text-sm text-gray-500">You pay</div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CoinsIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="font-medium">ETH</div>
                <div className="text-xs text-gray-500">Ether</div>
              </div>
            </div>
            <Input
              type="text"
              value={ethAmount}
              readOnly
              className="w-24 text-right border-none text-lg font-medium focus-visible:ring-0 p-0"
            />
          </div>
          <div className="mt-2 text-right text-sm text-gray-500">~$4,80.93</div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="h-8 w-8 rounded-full border flex items-center justify-center">
          <ArrowDown className="h-4 w-4" />
        </div>
      </div>

      {/* You Receive Section */}
      <div className="space-y-2">
        <div className="text-sm text-gray-500">You receive</div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Coins className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <div className="font-medium text-blue-500">Select a token</div>
                <ChevronDown className="h-3 w-3 text-blue-500" />
              </div>
            </div>
            <Input
              type="text"
              value={tokenAmount}
              readOnly
              className="w-24 text-right border-none text-lg font-medium focus-visible:ring-0 p-0"
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {activeTab === "completed" && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">APY</span>
            <span className="font-medium text-blue-600">3.2%</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-gray-600">Collateral Factor</span>
            <span className="font-medium">80%</span>
          </div>
        </div>
      )}
    </div>
  );
}
