"use client";

import { useState } from "react";
import { Loader2, X, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UrlSourceFormProps {
  onSubmit: (data: { name: string; sourceUrl: string }) => Promise<void>;
  disabled?: boolean;
}

const PROTO_RE = /^https?:\/\//i;

export function UrlSourceForm({ onSubmit, disabled }: UrlSourceFormProps) {
  const [protocol, setProtocol] = useState("https://");
  const [urlInput, setUrlInput] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || disabled) return;
    const cleanInput = urlInput.trim().replace(PROTO_RE, "");
    const fullUrl = protocol + cleanInput;
    if (!urlInput.trim()) {
      setError("URL is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim() || cleanInput,
        sourceUrl: fullUrl,
      });
      setUrlInput("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add URL.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#0A0A0A]">URL</label>
        <div className="flex items-center gap-0">
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            disabled={saving || disabled}
            className="h-10 rounded-l-lg border border-[#E4E4E7] border-r-0 bg-white px-2 text-[12px] text-[#71717A] outline-none transition-all hover:border-[#D4D4D8] focus-visible:border-[#0A0A0A] focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/5 disabled:bg-[#F4F4F5]"
          >
            <option value="https://">https://</option>
            <option value="http://">http://</option>
          </select>
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="www.example.com"
            disabled={saving || disabled}
            className="rounded-l-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#0A0A0A]">
          Name <span className="text-[#A1A1AA]">(optional)</span>
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Documentation"
          disabled={saving || disabled}
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
        disabled={saving || disabled || !urlInput.trim()}
        size="sm"
        className="self-start"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <Link size={14} />
            Add link
          </>
        )}
      </Button>
    </form>
  );
}
