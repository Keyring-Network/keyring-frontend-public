import { Code } from "lucide-react";
import { Eye } from "lucide-react";
import { Button } from "../ui/button";

interface ViewModeToggleProps {
  viewMode: "preview" | "code";
  setViewMode: (mode: "preview" | "code") => void;
}

export function ViewModeToggle({ viewMode, setViewMode }: ViewModeToggleProps) {
  return (
    <div className="bg-firefly-100 rounded-lg p-1 flex gap-1">
      <Button
        variant={viewMode === "preview" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("preview")}
        className="flex items-center gap-2 min-w-24"
      >
        <Eye className="h-4 w-4" />
        Preview
      </Button>
      <Button
        variant={viewMode === "code" ? "default" : "ghost"}
        size="sm"
        onClick={() => setViewMode("code")}
        className="flex items-center gap-2 min-w-24"
      >
        <Code className="h-4 w-4" />
        Code
      </Button>
    </div>
  );
}
