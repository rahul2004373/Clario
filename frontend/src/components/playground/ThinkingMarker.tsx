"use client";

import { memo } from "react";

export const ThinkingMarker = memo(function ThinkingMarker() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-[#1f1f22] px-4 py-3">
        <span className="text-[13px] text-[#A1A1AA]">thinking</span>
        <span className="size-1.5 animate-bounce rounded-full bg-[#A1A1AA] [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#A1A1AA] [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-[#A1A1AA] [animation-delay:300ms]" />
      </div>
    </div>
  );
});
