import {
  ChevronLeft,
  ChevronRight,
  LockIcon,
  PlusCircleIcon,
} from "lucide-react";
import Image from "next/image";

interface BrowserFrameProps {
  icon: string;
  title: string;
  url: string;
}

export function BrowserFrame({ icon, title, url }: BrowserFrameProps) {
  return (
    <>
      {/* Browser Tab Bar */}
      <div className="bg-gray-200 p-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex items-center bg-white rounded px-2 py-1 text-xs gap-2 ml-2">
          <Image src={icon} alt={title} width={16} height={16} />
          <span className="font-medium">{title}</span>
        </div>
        <div className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-300 text-gray-500">
          <span className="text-xs">+</span>
        </div>
      </div>

      {/* URL Bar */}
      <div className="bg-gray-100 p-2 flex items-center gap-2 border-b">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex gap-2 text-gray-400">
            <ChevronLeft className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 bg-white rounded px-2 py-1 text-xs flex-1 border">
            <LockIcon className="w-2 h-2" />
            <span className="text-gray-600">{url}</span>
          </div>
        </div>
        <div className="flex gap-2 text-gray-500">
          <PlusCircleIcon className="w-4 h-4" />
        </div>
      </div>
    </>
  );
}
