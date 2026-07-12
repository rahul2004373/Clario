"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSourceStore } from "@/store/sourceStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import type { Source } from "@/lib/api/sources";

interface SourceDetailsDrawerProps {
  source: Source;
  workspaceId: string;
  chatbotId: string;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-[13px] text-[#0A0A0A]">{value}</p>
    </div>
  );
}

export function SourceDetailsDrawer({
  source,
  workspaceId,
  chatbotId,
  onClose,
}: SourceDetailsDrawerProps) {
  const updateSource = useSourceStore((s) => s.updateSource);
  const { canEdit } = useWorkspaceRole();

  const [name, setName] = useState(source.name);
  const [language, setLanguage] = useState(source.metadata?.language ?? "");
  const [author, setAuthor] = useState(source.metadata?.author ?? "");
  const [tags, setTags] = useState(source.metadata?.tags?.join(", ") ?? "");
  const [description, setDescription] = useState(
    source.metadata?.description ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setName(source.name);
    setLanguage(source.metadata?.language ?? "");
    setAuthor(source.metadata?.author ?? "");
    setTags(source.metadata?.tags?.join(", ") ?? "");
    setDescription(source.metadata?.description ?? "");
  }, [source]);

  const isDirty =
    name !== source.name ||
    language !== (source.metadata?.language ?? "") ||
    author !== (source.metadata?.author ?? "") ||
    tags !== (source.metadata?.tags?.join(", ") ?? "") ||
    description !== (source.metadata?.description ?? "");

  const handleSave = async () => {
    if (!canEdit || saving || !isDirty) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await updateSource(workspaceId, chatbotId, source.id, {
        name: name.trim(),
        metadata: {
          ...(language.trim() ? { language: language.trim() } : {}),
          ...(author.trim() ? { author: author.trim() } : {}),
          ...(tagList.length > 0 ? { tags: tagList } : {}),
          ...(description.trim()
            ? { description: description.trim() }
            : {}),
        },
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed right-0 top-0 z-50 h-full w-[420px] border-l border-[#D4D4D8] bg-white shadow-lg overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#D4D4D8] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#0A0A0A]">
            Source details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-[#0A0A0A]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1 p-5">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#71717A] uppercase tracking-wide">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit || saving}
            />
          </div>

          {/* Section 1: Overview (read-only definition list) */}
          <div className="mt-5">
            <h3 className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wide">
              Overview
            </h3>
            <div className="mt-3 flex flex-col gap-3">
              <InfoRow label="Type" value={source.type} />
              <InfoRow label="Created" value={formatDate(source.createdAt)} />
              <InfoRow label="Updated" value={formatDate(source.updatedAt)} />
              {source.fileSize != null && source.fileSize > 0 && (
                <InfoRow label="File size" value={formatSize(source.fileSize)} />
              )}
            </div>
          </div>

          {/* Section 2: Source URL (read-only link row) */}
          {(source.sourceUrl || source.fileUrl) && (
            <div className="mt-6">
              <h3 className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wide">
                Source
              </h3>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#D4D4D8] px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[13px] text-[#71717A]">
                  {(source.sourceUrl ?? source.fileUrl) ?? ""}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    window.open(source.sourceUrl ?? source.fileUrl, "_blank")
                  }
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#71717A] hover:bg-[#F4F4F5]"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Metadata (editable, with distinct background) */}
          <div className="mt-6">
            <h3 className="text-[12px] font-semibold text-[#71717A] uppercase tracking-wide">
              Metadata
            </h3>
            <div className="mt-3 rounded-lg bg-[#FAFAFA] border border-[#E4E4E7] p-4 flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#71717A] uppercase tracking-wide">
                  Language
                </label>
                <Input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="English"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#71717A] uppercase tracking-wide">
                  Author
                </label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="Author name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#71717A] uppercase tracking-wide">
                  Tags <span className="text-[#A1A1AA]">(comma-separated)</span>
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={!canEdit || saving}
                  placeholder="AI, RAG, docs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#71717A] uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canEdit || saving}
                  rows={3}
                  className="w-full resize-none rounded-md border border-[#D4D4D8] bg-white px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10 disabled:bg-[#F4F4F5]"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[#E4E4E7] pt-4">
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
              className="min-w-[80px]"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
