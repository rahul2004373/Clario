"use client";

import { memo } from "react";

interface UserBubbleProps {
  content: string;
}

export const UserBubble = memo(function UserBubble({ content }: UserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#F97316] px-4 py-2.5 text-sm leading-relaxed text-white">
        {content}
      </div>
    </div>
  );
});
