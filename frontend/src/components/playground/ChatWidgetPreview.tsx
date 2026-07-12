"use client";

import { RefreshCw, Bot } from "lucide-react";
import { MessageList } from "./MessageList";
import { ChatInputBar } from "./ChatInputBar";
import type { ChatMessage } from "@/lib/api/playground";

interface ChatWidgetPreviewProps {
  messages: ChatMessage[];
  welcomeMessage?: string;
  isStreaming: boolean;
  onSend: (message: string) => void;
  onClear: () => void;
  disabled: boolean;
  chatbotName?: string;
}

export function ChatWidgetPreview({
  messages,
  welcomeMessage,
  isStreaming,
  onSend,
  onClear,
  disabled,
  chatbotName,
}: ChatWidgetPreviewProps) {
  const displayName = chatbotName || "Launchpad";

  return (
    <div className="mx-auto flex h-[680px] w-full max-w-[420px] shrink-0 flex-col overflow-hidden rounded-[24px] border border-[#27272A] bg-[#18181B] shadow-xl">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-gradient-to-b from-[#2a2a2e] via-[#222226] to-[#1a1a1d] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#F97316]">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-[11px] text-[#52525B]">Online</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="flex size-8 items-center justify-center rounded-lg text-[#52525B] transition-colors hover:bg-[#27272A] hover:text-[#A1A1AA] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="New chat"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Messages - takes remaining space, scrolls internally */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          welcomeMessage={welcomeMessage}
          isStreaming={isStreaming}
        />
      </div>

      {/* Input */}
      <div className="shrink-0">
        <ChatInputBar onSend={onSend} disabled={disabled} isStreaming={isStreaming} />
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#27272A] bg-[#1a1a1d] py-2.5 text-center">
        <p className="text-[10px] text-[#52525B]">Powered by Clairo</p>
      </div>
    </div>
  );
}
