"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/lib/api/conversations";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "USER";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[75%] rounded-lg px-3.5 py-2 text-[14px] leading-relaxed ${
          isUser
            ? "bg-[#0A0A0A] text-white rounded-br-sm"
            : "bg-[#F4F4F5] text-[#0A0A0A] rounded-bl-sm"
        }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:text-[14px] prose-headings:font-semibold prose-strong:font-semibold prose-ul:my-1 prose-li:my-0.5 prose-p:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <div
          className={`mt-1 text-[11px] ${
            isUser ? "text-white/50" : "text-[#A1A1AA]"
          }`}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
