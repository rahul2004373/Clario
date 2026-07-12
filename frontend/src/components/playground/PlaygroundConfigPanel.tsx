"use client";

import { useState, useEffect } from "react";
import { Clock, RotateCcw } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getLastTrained } from "@/lib/api/chatbots";

const INSTRUCTIONS = [
  { value: "base", label: "Base Instructions" },
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "concise", label: "Concise" },
];

const INSTRUCTION_CONTENT: Record<string, string> = {
  base: "You are a helpful AI assistant. Answer questions accurately and concisely. If you don't know the answer, say so.",
  friendly: "You are a friendly and approachable AI assistant. Use warm language and engage with users in a conversational tone. Be supportive and encouraging.",
  professional: "You are a professional AI assistant. Maintain formal language, provide precise and well-structured responses. Cite sources when possible.",
  concise: "You are a concise AI assistant. Provide brief, direct answers. Avoid unnecessary elaboration. Get straight to the point.",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function PlaygroundConfigPanel({
  workspaceId,
  chatbotId,
}: {
  workspaceId: string;
  chatbotId: string;
}) {
  const [instruction, setInstruction] = useState("base");
  const [lastTrained, setLastTrained] = useState<string | null>(null);
  const [loadingTrained, setLoadingTrained] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingTrained(true);
    getLastTrained(workspaceId, chatbotId)
      .then((res) => {
        if (!cancelled) {
          setLastTrained(res.lastTrainedAt);
          setLoadingTrained(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingTrained(false);
      });
    return () => { cancelled = true; };
  }, [workspaceId, chatbotId]);

  const selectedLabel = INSTRUCTIONS.find(
    (i) => i.value === instruction,
  )?.label;

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-6">
      {/* Page header */}
      <div>
        <h1 className="text-lg font-semibold text-[#0A0A0A]">Playground</h1>
        <p className="mt-1 text-[13px] text-[#71717A]">
          Test your chatbot before going live.
        </p>
      </div>

      {/* Last trained */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-[12px] text-[#A1A1AA]">
          <Clock size={13} />
          <span>Last trained</span>
        </div>
        <p className="mt-0.5 text-[13px] font-medium text-[#0A0A0A]">
          {loadingTrained
            ? "Loading..."
            : lastTrained
              ? relativeTime(lastTrained)
              : "Not trained yet"}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-[#F0F0F1]" />

      {/* System instruction */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-[#0A0A0A]">
            System instruction
          </label>
          <button
            type="button"
            onClick={() => setInstruction("base")}
            className="flex size-7 items-center justify-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-[#F4F4F5] hover:text-[#0A0A0A]"
            aria-label="Reset instruction"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="mt-2">
          <Select value={instruction} onValueChange={setInstruction}>
            <SelectTrigger>
              <SelectValue placeholder="Select preset">
                {selectedLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {INSTRUCTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <textarea
          key={instruction}
          rows={10}
          defaultValue={INSTRUCTION_CONTENT[instruction]}
          className="mt-3 w-full resize-none rounded-xl border border-[#E4E4E7] bg-white px-4 py-3 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all hover:border-[#D4D4D8] focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/5"
        />
      </div>
    </div>
  );
}
