"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertTriangle, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatbotStore } from "@/store/chatbotStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

interface AgentDetailsFormProps {
  workspaceId: string;
  chatbotId: string;
}

export function AgentDetailsForm({
  workspaceId,
  chatbotId,
}: AgentDetailsFormProps) {
  const router = useRouter();
  const currentChatbot = useChatbotStore((s) => s.currentChatbot);
  const updateChatbot = useChatbotStore((s) => s.updateChatbot);
  const deleteChatbot = useChatbotStore((s) => s.deleteChatbot);
  const { canEdit, canDelete } = useWorkspaceRole();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [idCopied, setIdCopied] = useState(false);

  useEffect(() => {
    if (currentChatbot) {
      setName(currentChatbot.name);
      setDescription(currentChatbot.description ?? "");
    }
  }, [currentChatbot]);

  const isDirty = currentChatbot
    ? name !== currentChatbot.name ||
      description !== (currentChatbot.description ?? "")
    : false;

  const handleSave = async () => {
    if (!canEdit || saving || !isDirty) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateChatbot(workspaceId, chatbotId, {
        name: name.trim(),
        description: description.trim() || undefined,
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

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteChatbot(workspaceId, chatbotId);
      router.push(`/workspace/${workspaceId}/agents`);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete agent.",
      );
      setDeleting(false);
    }
  };

  const handleCopyId = async () => {
    if (!currentChatbot) return;
    try {
      await navigator.clipboard.writeText(currentChatbot.id);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    } catch {}
  };

  if (!currentChatbot) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-[#D4D4D8] bg-white">
        <div className="px-5 py-4">
          <h2 className="text-[16px] font-semibold text-[#0A0A0A]">
            Agent details
          </h2>
        </div>
        <div className="border-t border-[#D4D4D8] px-5 py-5">
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#0A0A0A]">
                Agent ID
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={currentChatbot.id}
                  disabled
                  className="bg-[#F4F4F5] text-[#71717A] font-mono text-[12px]"
                />
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#D4D4D8] text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] transition-colors"
                >
                  {idCopied ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="agent-name"
                className="text-[13px] font-medium text-[#0A0A0A]"
              >
                Agent name
              </label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit || saving}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="agent-description"
                className="text-[13px] font-medium text-[#0A0A0A]"
              >
                Description
              </label>
              <textarea
                id="agent-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit || saving}
                rows={3}
                className="w-full resize-none rounded-lg border border-[#D4D4D8] bg-white px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all duration-150 focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10 disabled:bg-[#F4F4F5] disabled:text-[#71717A]"
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

      {canDelete && (
        <div>
          <div className="relative mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#FCA5A5]/40" />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#EF4444]/60">
              Danger Zone
            </span>
            <div className="h-px flex-1 bg-[#FCA5A5]/40" />
          </div>

          <div className="rounded-xl border border-[#FCA5A5]/50 bg-white">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[#0A0A0A]">
                  Delete agent
                </h3>
                <p className="mt-1 text-[13px] text-[#71717A]">
                  Permanently delete this agent and all of its data. This
                  action cannot be undone.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                className="shrink-0 whitespace-nowrap"
              >
                <AlertTriangle size={14} />
                Delete
              </Button>
            </div>
          </div>

          {deleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => !deleting && setDeleteConfirmOpen(false)}
              />
              <div className="relative z-10 w-full max-w-[400px] rounded-xl border border-[#D4D4D8] bg-white p-6 shadow-lg">
                <h3 className="text-[16px] font-semibold text-[#0A0A0A]">
                  Delete agent
                </h3>
                <p className="mt-2 text-[13px] text-[#71717A]">
                  Are you sure you want to delete{" "}
                  <strong className="text-[#0A0A0A]">
                    {currentChatbot.name}
                  </strong>
                  ? This will permanently remove all data and cannot be undone.
                </p>
                {deleteError && (
                  <p className="mt-2 text-[12px] text-[#EF4444]">
                    {deleteError}
                  </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deleting}
                    onClick={() => setDeleteConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Delete agent"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
