"use client";

import type { Conversation } from "@/lib/api/conversations";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  conversation,
  isSelected,
  onClick,
}: ConversationListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#F4F4F5] ${
        isSelected ? "bg-[#F4F4F5]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[14px] font-medium text-[#0A0A0A]">
          {conversation.sessionId || conversation.id.slice(0, 8)}
        </span>
        <span className="shrink-0 text-[12px] text-[#A1A1AA]">
          {timeAgo(conversation.lastActivityAt)}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="text-[13px] text-[#71717A]">
          {conversation.chatbot.name}
        </span>
        <span
          className={`inline-flex h-1.5 w-1.5 rounded-full ${
            conversation.isActive && !conversation.resolvedAt
              ? "bg-[#22C55E]"
              : "bg-[#A1A1AA]"
          }`}
        />
      </div>
      {/* TODO: Add message preview snippet when the API includes a preview field or when a separate lightweight endpoint is available */}
    </button>
  );
}
