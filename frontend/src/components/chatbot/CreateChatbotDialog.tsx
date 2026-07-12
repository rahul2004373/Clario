"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatbotStore } from "@/store/chatbotStore";

interface CreateChatbotDialogProps {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
}

export function CreateChatbotDialog({
  workspaceId,
  open,
  onClose,
}: CreateChatbotDialogProps) {
  const router = useRouter();
  const createChatbot = useChatbotStore((s) => s.createChatbot);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!systemPrompt.trim()) {
      setError("System prompt is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const chatbot = await createChatbot(workspaceId, {
        name: name.trim(),
        systemPrompt: systemPrompt.trim(),
        ...(description.trim()
          ? { description: description.trim() }
          : {}),
      });
      onClose();
      setName("");
      setSystemPrompt("");
      setDescription("");
      router.push(
        `/workspace/${workspaceId}/chatbot/${chatbot.id}/playground`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create chatbot.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[480px] rounded-xl border border-[#D4D4D8] bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#0A0A0A]">
            Create new AI agent
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-[#0A0A0A]"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="chatbot-name"
              className="text-[13px] font-medium text-[#0A0A0A]"
            >
              Name <span className="text-[#EF4444]">*</span>
            </label>
            <Input
              id="chatbot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Support Bot"
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="chatbot-prompt"
              className="text-[13px] font-medium text-[#0A0A0A]"
            >
              System prompt <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              id="chatbot-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant."
              disabled={saving}
              rows={4}
              className="w-full resize-none rounded-lg border border-[#D4D4D8] bg-white px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all duration-150 focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10 disabled:bg-[#F4F4F5] disabled:text-[#71717A]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="chatbot-desc"
              className="text-[13px] font-medium text-[#0A0A0A]"
            >
              Description <span className="text-[#A1A1AA]">(optional)</span>
            </label>
            <Input
              id="chatbot-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Support assistant"
              disabled={saving}
            />
          </div>

          {error && (
            <p className="text-[12px] text-[#EF4444]">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onClose}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              size="sm"
              className="min-w-[80px]"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
