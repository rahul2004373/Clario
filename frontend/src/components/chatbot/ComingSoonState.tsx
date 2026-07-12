"use client";

import { Bot } from "lucide-react";

interface ComingSoonStateProps {
  title: string;
}

export function ComingSoonState({ title }: ComingSoonStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F4F5]">
        <Bot size={24} className="text-[#A1A1AA]" />
      </div>
      <div className="text-center">
        <h2 className="text-[15px] font-medium text-[#0A0A0A]">{title}</h2>
        <p className="mt-1 text-[13px] text-[#71717A]">
          This feature isn&apos;t available yet.
        </p>
      </div>
    </div>
  );
}
