"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
  isStreaming: boolean;
}

export function ChatInputBar({ onSend, disabled, isStreaming }: ChatInputBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed);
    setValue("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, [value, disabled, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="bg-[#1a1a1d] px-3 pb-3 pt-1">
      <div className="flex items-center gap-2 rounded-[28px] border border-[#333338] bg-[#1f1f22] px-4 py-2 transition-colors focus-within:border-[#52525B]">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          disabled={disabled}
          className="max-h-[80px] min-h-[20px] flex-1 resize-none bg-transparent text-sm text-[#E4E4E7] outline-none placeholder:text-[#52525B] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || disabled || isStreaming}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-white transition-all hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
