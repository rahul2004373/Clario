"use client";

import { useState } from "react";
import { Loader2, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextSnippetFormProps {
  onSubmit: (data: { name: string; content: string }) => Promise<void>;
  disabled?: boolean;
}

export function TextSnippetForm({
  onSubmit,
  disabled,
}: TextSnippetFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || disabled) return;
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add text.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#0A0A0A]">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Company Policy"
          disabled={saving || disabled}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#0A0A0A]">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Very long text..."
          disabled={saving || disabled}
          rows={6}
          className="w-full resize-none rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 text-[13px] text-[#0A0A0A] outline-none placeholder:text-[#A1A1AA] transition-all duration-150 hover:border-[#D4D4D8] focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/5 disabled:bg-[#F4F4F5] disabled:text-[#71717A]"
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-700">
          <X size={12} className="shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={saving || disabled || !title.trim() || !content.trim()}
        size="sm"
        className="self-start"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <FileText size={14} />
            Add text
          </>
        )}
      </Button>
    </form>
  );
}
