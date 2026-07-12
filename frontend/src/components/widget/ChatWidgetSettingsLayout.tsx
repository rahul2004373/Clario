"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChatWidgetPreview } from "./ChatWidgetPreview";
import type { ChatWidget } from "@/lib/api/widget";

interface ChatWidgetSettingsLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string }[];
  leftPanel: ReactNode;
  saveBar?: ReactNode;
  config: ChatWidget;
}

export function ChatWidgetSettingsLayout({
  activeTab,
  onTabChange,
  tabs,
  leftPanel,
  saveBar,
  config,
}: ChatWidgetSettingsLayoutProps) {
  return (
    <div className="flex h-full">
      {/* Left: Tabs + form + save bar */}
      <div className="flex w-[480px] shrink-0 flex-col border-r border-[#E4E4E7] bg-white">
        <div className="flex gap-0 overflow-x-auto border-b border-[#D4D4D8] px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative whitespace-nowrap px-4 py-3 text-[13px] font-medium transition-colors",
                activeTab === tab.id
                  ? "text-[#0A0A0A]"
                  : "text-[#71717A] hover:text-[#0A0A0A]",
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A0A0A]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2 pt-5">{leftPanel}</div>

        {saveBar && (
          <div className="shrink-0 px-6 pb-4">{saveBar}</div>
        )}
      </div>

      {/* Right: Sticky preview */}
      <div className="flex flex-1 items-start justify-center overflow-hidden bg-[#F4F4F5] bg-[radial-gradient(#D4D4D8_1px,transparent_1px)] bg-[length:16px_16px] p-6">
        <div className="sticky top-6 h-[580px] w-full max-w-[380px]">
          <ChatWidgetPreview config={config} mode="preview" />
        </div>
      </div>
    </div>
  );
}
