"use client";

import { memo } from "react";
import type { ChatMessage } from "@/lib/api/playground";
import { UserBubble } from "./UserBubble";
import { AssistantBubble } from "./AssistantBubble";
import { ThinkingMarker } from "./ThinkingMarker";

interface MessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const MessageItem = memo(function MessageItem({
  message,
  isStreaming,
}: MessageItemProps) {
  if (message.role === "USER") {
    return (
      <div className="mb-3 last:mb-0">
        <UserBubble content={message.content} />
      </div>
    );
  }

  if (message.role === "ASSISTANT") {
    if (isStreaming && !message.content) {
      return (
        <div className="mb-3 last:mb-0">
          <ThinkingMarker />
        </div>
      );
    }
    return (
      <div className="mb-3 last:mb-0">
        <AssistantBubble content={message.content} />
      </div>
    );
  }

  return null;
});
