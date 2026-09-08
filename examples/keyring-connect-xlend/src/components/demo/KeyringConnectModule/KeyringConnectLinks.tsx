import {
  ExternalLink,
  Code2,
  Github,
  BookOpen,
  Database,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DATA_SHARING_DOCS_URL } from "@/config";

export const KeyringConnectLinks = () => {
  const [isVisible, setIsVisible] = useState(false);
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50 xl:block">
        <Button
          size="sm"
          variant="ghost"
          className="w-10 h-10 p-0 bg-teal text-firefly rounded-full border border-blue-100 shadow-lg hover:bg-teal/60 hover:border-teal"
          aria-label="Open developer resources"
          onClick={() => setIsVisible(true)}
        >
          <Code2 className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 xl:block">
      <div className="relative bg-firefly text-white rounded-xl p-3 border border-blue-100 shadow-lg min-w-[250px] max-w-[280px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-teal text-firefly rounded-md flex items-center justify-center">
            <Code2 className="w-4 h-4 " />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-semibold">Keyring Connect</h3>
            <p className="text-xs ">Dev Resources</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="w-6 h-6 p-0 text-white/50 hover:bg-white"
            aria-label="Close developer resources"
            onClick={() => setIsVisible(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1">
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-xs text-teal hover:bg-firefly-100"
            onClick={() => {
              window.open(
                "https://github.com/Keyring-Network/keyring-frontend-public/tree/master/examples/keyring-connect-xlend",
                "_blank"
              );
            }}
          >
            <Github className="w-3 h-3" />
            <span className="flex-1 text-left">xLend Example</span>
            <ExternalLink className="w-3 h-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-xs text-teal   hover:bg-firefly-100"
            onClick={() => {
              window.open(
                "https://www.npmjs.com/package/@keyringnetwork/keyring-connect-sdk",
                "_blank"
              );
            }}
          >
            <BookOpen className="w-3 h-3" />
            <span className="flex-1 text-left">SDK Docs</span>
            <ExternalLink className="w-3 h-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2 h-8 text-xs text-teal hover:bg-firefly-100"
            onClick={() => {
              window.open(DATA_SHARING_DOCS_URL, "_blank");
            }}
          >
            <Database className="w-3 h-3" />
            <span className="flex-1 text-left">Data Sharing Docs</span>
            <ExternalLink className="w-3 h-3" />
          </Button>

        </div>
      </div>
    </div>
  );
};
