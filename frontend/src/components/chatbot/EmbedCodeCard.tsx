"use client";

import { useState, useEffect } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEmbedCode } from "@/lib/api/chatbots";

interface EmbedCodeCardProps {
  chatbotId: string;
  workspaceId: string;
}

export function EmbedCodeCard({
  chatbotId,
  workspaceId,
}: EmbedCodeCardProps) {
  const [embedCode, setEmbedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEmbedCode(workspaceId, chatbotId)
      .then((res) => {
        if (!cancelled) {
          setEmbedCode(res.embedCode);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load embed code.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, chatbotId]);

  const handleCopy = async () => {
    if (!embedCode) return;
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  };

  return (
    <div className="rounded-xl border border-[#D4D4D8] bg-white">
      <div className="px-5 py-4">
        <h2 className="text-[16px] font-semibold text-[#0A0A0A]">
          Embed code
        </h2>
      </div>
      <div className="border-t border-[#D4D4D8] px-5 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-[#71717A]" />
          </div>
        ) : error ? (
          <p className="text-[13px] text-[#EF4444]">{error}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <pre className="overflow-x-auto rounded-lg border border-[#D4D4D8] bg-[#FAFAFA] p-4 text-[12px] text-[#0A0A0A]">
              <code>{embedCode}</code>
            </pre>
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
                    <Check size={14} className="text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
