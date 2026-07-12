"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, RefreshCw, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatWidget } from "@/lib/api/widget";

interface ChatWidgetPreviewProps {
  config: Partial<ChatWidget>;
  mode: "preview" | "live";
  isStreaming?: boolean;
  messages?: { role: string; content: string }[];
  onSend?: (message: string) => void;
  onReset?: () => void;
  onClose?: () => void;
}

const DEFAULTS: ChatWidget = {
  initialMessages: ["Hi there! How can I help you today?"],
  theme: "LIGHT",
  primaryColor: "#000000",
  bubbleColor: "#000000",
  bubbleAlignment: "BOTTOM_RIGHT",
  isActive: false,
};

function UserMessage({ content }: { content: string }) {
  return <span>{content}</span>;
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="prose-custom">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <h1 className="mb-2 mt-3 text-[15px] font-bold leading-snug first:mt-0" {...props}>{children}</h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="mb-1.5 mt-2.5 text-[14px] font-bold leading-snug first:mt-0" {...props}>{children}</h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="mb-1 mt-2 text-[13px] font-semibold leading-snug first:mt-0" {...props}>{children}</h3>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-2 last:mb-0 leading-relaxed" {...props}>{children}</p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0" {...props}>{children}</ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0" {...props}>{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>{children}</li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold" {...props}>{children}</strong>
          ),
          code: ({ children, ...props }) => (
            <code className="rounded bg-black/20 px-1 py-0.5 text-[12px] font-mono" {...props}>{children}</code>
          ),
          pre: ({ children, ...props }) => (
            <pre className="mb-2 overflow-x-auto rounded-lg bg-black/20 p-3 text-[12px] last:mb-0" {...props}>{children}</pre>
          ),
          a: ({ children, href, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-white/40 hover:decoration-white/70" {...props}>{children}</a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function SafeAvatar({ src }: { src?: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Bot size={12} className="text-white" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="size-6 shrink-0 rounded-full object-cover"
      onError={() => setErrored(true)}
    />
  );
}

export function ChatWidgetPreview({
  config,
  mode,
  isStreaming,
  messages = [],
  onSend,
  onReset,
  onClose,
}: ChatWidgetPreviewProps) {
  const merged = { ...DEFAULTS, ...config };
  const isDark = merged.theme === "DARK";
  const accentColor = merged.primaryColor || "#000000";
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value.trim();
      if (val && onSend) {
        onSend(val);
        (e.target as HTMLInputElement).value = "";
      }
    }
  };

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-[18px] shadow-lg ${isDark ? "bg-[#18181B] shadow-black/25" : "bg-white shadow-black/10"}`}>
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3"
        style={{ backgroundColor: accentColor, color: "#fff" }}
      >
        <div className="flex items-center gap-2">
          <SafeAvatar src={merged.profilePictureUrl} />
          <span className="text-[13px] font-semibold tracking-tight">
            {merged.displayName || "Chatbot"}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {mode === "live" && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex size-6 items-center justify-center rounded-md text-white/70 hover:bg-white/10 transition-colors"
              aria-label="New chat"
            >
              <RefreshCw size={12} />
            </button>
          )}
          {mode === "preview" && (
            <button
              type="button"
              disabled
              className="flex size-6 items-center justify-center rounded-md text-white/30 cursor-default"
              aria-label="Preview"
            >
              <RefreshCw size={12} />
            </button>
          )}
          {mode === "live" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex size-6 items-center justify-center rounded-md text-white/70 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 scroll-smooth">
        {messages.length === 0 &&
          merged.initialMessages.map((msg, i) => (
            <div key={`init-${i}`} className="mb-2.5 flex justify-start last:mb-0">
              <div
                className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  isDark
                    ? "bg-[#27272A] text-[#E4E4E7]"
                    : "bg-[#F4F4F5] text-[#0A0A0A]"
                }`}
              >
                {msg}
              </div>
            </div>
          ))}
        {messages.map((msg, i) => (
          <div
            key={`msg-${i}`}
            className={`mb-2.5 flex last:mb-0 ${
              msg.role === "USER" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "USER"
                  ? "text-white"
                  : isDark
                    ? "bg-[#27272A] text-[#E4E4E7]"
                    : "bg-[#F4F4F5] text-[#0A0A0A]"
              }`}
              style={
                msg.role === "USER"
                  ? { backgroundColor: accentColor }
                  : undefined
              }
            >
              {msg.role === "ASSISTANT" ? (
                msg.content ? (
                  <AssistantMessage content={msg.content} />
                ) : (
                  <span className="opacity-50">...</span>
                )
              ) : (
                <UserMessage content={msg.content} />
              )}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div
              className={`rounded-[16px] px-3.5 py-2.5 ${
                isDark ? "bg-[#27272A]" : "bg-[#F4F4F5]"
              }`}
            >
              <span className="inline-flex gap-1">
                <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-3 pb-3">
        {mode === "preview" ? (
          <div className={`flex items-center gap-2 rounded-[14px] px-3.5 py-2.5 ${isDark ? "bg-[#27272A]" : "bg-[#F4F4F5]"}`}>
            <span className="flex-1 text-[12px] text-[#52525B]">
              {merged.messagePlaceholder || "Type a message..."}
            </span>
          </div>
        ) : (
          <div className={`flex items-center gap-2 rounded-[14px] px-3.5 py-2 ${isDark ? "bg-[#27272A]" : "bg-[#F4F4F5]"}`}>
            <input
              ref={inputRef}
              type="text"
              placeholder={merged.messagePlaceholder || "Type a message..."}
              className={`flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#52525B] ${isDark ? "text-[#E4E4E7]" : "text-[#0A0A0A]"}`}
              disabled={isStreaming}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: accentColor, color: "#fff" }}
              disabled={isStreaming}
              aria-label="Send"
            >
              <Send size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 pb-2.5 text-center text-[10px] text-[#52525B]">
        {merged.footerText || "Powered by Clairo"}
      </div>
    </div>
  );
}
