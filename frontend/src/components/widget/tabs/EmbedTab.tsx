"use client";

import { useState, useEffect } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getWidgetEmbedCode } from "@/lib/api/widget";

export function EmbedTab() {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();
  const [embedCode, setEmbedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getWidgetEmbedCode(params.workspaceId, params.chatbotId)
      .then((res) => {
        if (!cancelled) {
          setEmbedCode(res.embedCode);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load embed code.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.workspaceId, params.chatbotId]);

  const handleCopy = async () => {
    if (!embedCode) return;
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[14px] font-semibold text-[#0A0A0A]">
          Widget setup
        </h3>
        <p className="mt-1 text-[13px] text-[#71717A]">
          Copy and paste this code into your website to enable the chat widget.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin text-[#71717A]" />
        </div>
      ) : error ? (
        <p className="text-[13px] text-[#EF4444]">{error}</p>
      ) : (
        <div className="rounded-lg border border-[#D4D4D8] bg-[#FAFAFA]">
          <pre className="overflow-x-auto p-4 text-[12px] text-[#0A0A0A]">
            <code>{embedCode}</code>
          </pre>
        </div>
      )}

      {embedCode && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-600" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
