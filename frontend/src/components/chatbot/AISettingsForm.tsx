"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatbotStore } from "@/store/chatbotStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

interface AISettingsFormProps {
  workspaceId: string;
  chatbotId: string;
}

export function AISettingsForm({
  workspaceId,
  chatbotId,
}: AISettingsFormProps) {
  const currentChatbot = useChatbotStore((s) => s.currentChatbot);
  const updateChatbot = useChatbotStore((s) => s.updateChatbot);
  const { canEdit } = useWorkspaceRole();

  const [systemPrompt, setSystemPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [agentRole, setAgentRole] = useState("");
  const [agentTone, setAgentTone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (currentChatbot) {
      setSystemPrompt(currentChatbot.systemPrompt ?? "");
      setWelcomeMessage(currentChatbot.welcomeMessage ?? "");
      setFallbackMessage(currentChatbot.fallbackMessage ?? "");
      setAgentRole(currentChatbot.agentRole ?? "");
      setAgentTone(currentChatbot.agentTone ?? "");
    }
  }, [currentChatbot]);

  const isDirty = currentChatbot
    ? systemPrompt !== (currentChatbot.systemPrompt ?? "") ||
      welcomeMessage !== (currentChatbot.welcomeMessage ?? "") ||
      fallbackMessage !== (currentChatbot.fallbackMessage ?? "") ||
      agentRole !== (currentChatbot.agentRole ?? "") ||
      agentTone !== (currentChatbot.agentTone ?? "")
    : false;

  const handleSave = async () => {
    if (!canEdit || saving || !isDirty) return;
    if (!systemPrompt.trim()) {
      setSaveError("System prompt is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      // Changing systemPrompt auto-increments promptVersion server-side.
      // The frontend does not need to manage versioning.
      await updateChatbot(workspaceId, chatbotId, {
        systemPrompt: systemPrompt.trim(),
        welcomeMessage: welcomeMessage.trim() || undefined,
        fallbackMessage: fallbackMessage.trim() || undefined,
        agentRole: agentRole.trim() || undefined,
        agentTone: agentTone.trim() || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!currentChatbot) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-[#D4D4D8] bg-white">
        <div className="px-5 py-4">
          <h2 className="text-[16px] font-semibold text-[#0A0A0A]">
            AI configuration
          </h2>
        </div>
        <div className="border-t border-[#D4D4D8] px-5 py-5">
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label
                htmlFor="ai-system-prompt"
                className="text-[13px] font-medium text-[#0A0A0A]"
              >
                System prompt
              </label>
              <textarea
                id="ai-system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                disabled={!canEdit || saving}
                rows={6}
                className="w-full resize-none rounded-lg border border-[#D4D4D8] bg-white px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all duration-150 focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10 disabled:bg-[#F4F4F5] disabled:text-[#71717A]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ai-welcome"
                className="text-[13px] font-medium text-[#0A0A0A]"
              >
                Welcome message
              </label>
              <textarea
                id="ai-welcome"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                disabled={!canEdit || saving}
                rows={3}
                className="w-full resize-none rounded-lg border border-[#D4D4D8] bg-white px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all duration-150 focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10 disabled:bg-[#F4F4F5] disabled:text-[#71717A]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ai-fallback"
                className="text-[13px] font-medium text-[#0A0A0A]"
              >
                Fallback message
              </label>
              <textarea
                id="ai-fallback"
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
                disabled={!canEdit || saving}
                rows={3}
                className="w-full resize-none rounded-lg border border-[#D4D4D8] bg-white px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all duration-150 focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10 disabled:bg-[#F4F4F5] disabled:text-[#71717A]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ai-role"
                className="text-[13px] font-medium text-[#0A0A0A]"
              >
                Agent role
              </label>
              {
                // TODO: Convert to <Select> once backend enum values are confirmed.
                // Currently rendering as plain text input as a placeholder.
              }
              <Input
                id="ai-role"
                value={agentRole}
                onChange={(e) => setAgentRole(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="e.g. SUPPORT, SALES, etc."
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ai-tone"
                className="text-[13px] font-medium text-[#0A0A0A]"
              >
                Agent tone
              </label>
              {
                // TODO: Convert to <Select> once backend enum values are confirmed.
                // Currently rendering as plain text input as a placeholder.
              }
              <Input
                id="ai-tone"
                value={agentTone}
                onChange={(e) => setAgentTone(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="e.g. PROFESSIONAL, FRIENDLY, etc."
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-[13px] text-green-600">
                    <Check size={14} />
                    Saved
                  </span>
                )}
                {saveError && (
                  <span className="flex items-center gap-1.5 text-[13px] text-[#EF4444]">
                    <X size={14} />
                    {saveError}
                  </span>
                )}
              </div>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!canEdit || !isDirty || saving}
                size="sm"
                className="min-w-[80px] disabled:bg-[#D4D4D8] disabled:text-[#71717A]"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
