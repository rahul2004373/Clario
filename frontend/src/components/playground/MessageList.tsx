"use client";

import { memo } from "react";
import type { ChatMessage } from "@/lib/api/playground";
import { MessageScroll } from "./MessageScroll";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: ChatMessage[];
  welcomeMessage?: string;
  isStreaming: boolean;
}

export const MessageList = memo(function MessageList({
  messages,
  welcomeMessage,
  isStreaming,
}: MessageListProps) {
  return (
    <MessageScroll isStreaming={isStreaming}>
      {welcomeMessage && messages.length === 0 && (
        <div className="mb-4">
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-[#1f1f22] px-4 py-2.5 text-sm leading-relaxed text-[#E4E4E7]">
              {welcomeMessage}
            </div>
          </div>
        </div>
      )}

      {messages.map((msg, idx) => (
        <MessageItem
          key={msg.id ?? idx}
          message={msg}
          isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "ASSISTANT"}
        />
      ))}
    </MessageScroll>
  );
});
