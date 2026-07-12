"use client";

import { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/lib/api/conversations";

interface ChatTranscriptProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatTranscript({ messages, isLoading }: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`h-10 animate-pulse rounded-lg ${
                i % 2 === 0 ? "bg-[#E4E4E7] w-32" : "bg-[#0A0A0A]/10 w-48"
              }`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[13px] text-[#A1A1AA]">No messages yet.</p>
      </div>
    );
  }

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {sorted.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
