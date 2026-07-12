"use client";

import type { ChatWidget } from "@/lib/api/widget";

interface ContentTabProps {
  config: ChatWidget;
  onChange: (partial: Partial<ChatWidget>) => void;
  disabled: boolean;
}

export function ContentTab({ config, onChange, disabled }: ContentTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          Display name
        </label>
        <input
          type="text"
          value={config.displayName ?? ""}
          onChange={(e) => onChange({ displayName: e.target.value })}
          disabled={disabled}
          placeholder="My Chatbot"
          className="mt-1.5 block w-full rounded-lg border border-[#D4D4D8] px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] focus:border-[#0A0A0A] disabled:opacity-50"
        />
      </div>

      <div>
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          Initial messages
        </label>
        <p className="mt-0.5 text-[12px] text-[#71717A]">
          Enter each message in a new line.
        </p>
        <textarea
          value={config.initialMessages.join("\n")}
          onChange={(e) =>
            onChange({
              initialMessages: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          disabled={disabled}
          rows={4}
          className="mt-1.5 block w-full rounded-lg border border-[#D4D4D8] px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] focus:border-[#0A0A0A] disabled:opacity-50 resize-none"
        />
        <button
          type="button"
          onClick={() =>
            onChange({
              initialMessages: ["Hi there! How can I help you today?"],
            })
          }
          disabled={disabled}
          className="mt-1.5 text-[12px] text-[#71717A] hover:text-[#0A0A0A] disabled:opacity-50"
        >
          Reset to default
        </button>
      </div>

      <div>
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          Message placeholder
        </label>
        <input
          type="text"
          value={config.messagePlaceholder ?? ""}
          onChange={(e) => onChange({ messagePlaceholder: e.target.value })}
          disabled={disabled}
          placeholder="Type a message..."
          className="mt-1.5 block w-full rounded-lg border border-[#D4D4D8] px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] focus:border-[#0A0A0A] disabled:opacity-50"
        />
      </div>

      <div>
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          Footer text
        </label>
        <input
          type="text"
          value={config.footerText ?? ""}
          onChange={(e) => onChange({ footerText: e.target.value })}
          disabled={disabled}
          placeholder="Powered by Clairo"
          className="mt-1.5 block w-full rounded-lg border border-[#D4D4D8] px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] focus:border-[#0A0A0A] disabled:opacity-50"
        />
      </div>
    </div>
  );
}
