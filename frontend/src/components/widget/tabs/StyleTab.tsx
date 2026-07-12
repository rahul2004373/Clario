"use client";

import { Bot, Undo2 } from "lucide-react";
import type { ChatWidget } from "@/lib/api/widget";

interface StyleTabProps {
  config: ChatWidget;
  onChange: (partial: Partial<ChatWidget>) => void;
  disabled: boolean;
}

export function StyleTab({ config, onChange, disabled }: StyleTabProps) {
  return (
    <div className="space-y-5">
      {/* Theme */}
      <div>
        <label className="text-[13px] font-medium text-[#0A0A0A]">Theme</label>
        <div className="mt-1.5 flex gap-3">
          {(["LIGHT", "DARK"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ theme: t })}
              disabled={disabled}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-center text-[13px] font-medium transition-colors ${
                config.theme === t
                  ? "border-[#0A0A0A] bg-[#F4F4F5]"
                  : "border-[#D4D4D8] bg-white hover:border-[#A1A1AA]"
              } disabled:opacity-50`}
            >
              {t === "LIGHT" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
      </div>

      {/* Profile picture */}
      <div>
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          Profile picture URL
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F4F4F5]">
            {config.profilePictureUrl ? (
              <img
                src={config.profilePictureUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Bot size={16} className="text-[#A1A1AA]" />
            )}
          </div>
          <input
            type="text"
            value={config.profilePictureUrl ?? ""}
            onChange={(e) => onChange({ profilePictureUrl: e.target.value || undefined })}
            disabled={disabled}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-[#D4D4D8] px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] focus:border-[#0A0A0A] disabled:opacity-50"
          />
        </div>
      </div>

      {/* Primary color */}
      <div>
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          Primary color
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            disabled={disabled}
            className="size-9 cursor-pointer rounded-lg border border-[#D4D4D8] p-0.5 disabled:opacity-50"
          />
          <input
            type="text"
            value={config.primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            disabled={disabled}
            className="flex-1 rounded-lg border border-[#D4D4D8] px-3 py-2 text-[13px] text-[#0A0A0A] outline-none focus:border-[#0A0A0A] disabled:opacity-50 font-mono"
          />
          <button
            type="button"
            onClick={() => onChange({ primaryColor: "#000000" })}
            disabled={disabled}
            className="flex size-7 items-center justify-center rounded-lg border border-[#D4D4D8] text-[#71717A] hover:bg-[#F4F4F5] disabled:opacity-50"
          >
            <Undo2 size={13} />
          </button>
        </div>
      </div>

      {/* Bubble color */}
      <div>
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          Bubble color
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <input
            type="color"
            value={config.bubbleColor}
            onChange={(e) => onChange({ bubbleColor: e.target.value })}
            disabled={disabled}
            className="size-9 cursor-pointer rounded-lg border border-[#D4D4D8] p-0.5 disabled:opacity-50"
          />
          <input
            type="text"
            value={config.bubbleColor}
            onChange={(e) => onChange({ bubbleColor: e.target.value })}
            disabled={disabled}
            className="flex-1 rounded-lg border border-[#D4D4D8] px-3 py-2 text-[13px] text-[#0A0A0A] outline-none focus:border-[#0A0A0A] disabled:opacity-50 font-mono"
          />
          <button
            type="button"
            onClick={() => onChange({ bubbleColor: "#000000" })}
            disabled={disabled}
            className="flex size-7 items-center justify-center rounded-lg border border-[#D4D4D8] text-[#71717A] hover:bg-[#F4F4F5] disabled:opacity-50"
          >
            <Undo2 size={13} />
          </button>
        </div>
      </div>


    </div>
  );
}
