"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChatWidgetPreview } from "@/components/widget/ChatWidgetPreview";
import { fetchPublicWidgetConfig, createPublicSession, sendPublicMessageStream, endPublicSession, type PublicWidgetConfig } from "@/lib/api/publicWidget";
import { Loader2 } from "lucide-react";

type Message = { role: "USER" | "ASSISTANT"; content: string };

export default function WidgetUiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-transparent">
          <Loader2 size={24} className="animate-spin text-[#71717A]" />
        </div>
      }
    >
      <WidgetUiPageInner />
    </Suspense>
  );
}

function WidgetUiPageInner() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");

  const [config, setConfig] = useState<PublicWidgetConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const creatingSession = useRef(false);

  useEffect(() => {
    if (!key) {
      setConfigError("Missing embed key");
      setLoading(false);
      return;
    }
    fetchPublicWidgetConfig(key)
      .then((cfg) => {
        setConfig(cfg);
        if (!cfg.isActive) {
          setConfigError("Widget is inactive");
        }
        setLoading(false);
      })
      .catch((err) => {
        setConfigError(err instanceof Error ? err.message : "Failed to load widget");
        setLoading(false);
      });
  }, [key]);

  const ensureSession = useCallback(async () => {
    if (sessionId || creatingSession.current || !key) return sessionId;
    creatingSession.current = true;
    try {
      const res = await createPublicSession(key);
      setSessionId(res.sessionId);
      return res.sessionId;
    } finally {
      creatingSession.current = false;
    }
  }, [sessionId, key]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!key || sending) return;
      setMessages((prev) => [...prev, { role: "USER", content: text }]);
      setMessages((prev) => [...prev, { role: "ASSISTANT", content: "" }]);
      setSending(true);

      try {
        const sid = sessionId || (await ensureSession());
        if (!sid) {
          setMessages((prev) => prev.slice(0, -2));
          setSending(false);
          return;
        }

        let streamError = false;

        await sendPublicMessageStream(key, sid, text, {
          onChunk: (chunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === "ASSISTANT") {
                updated[updated.length - 1] = { ...last, content: last.content + chunk };
              }
              return updated;
            });
          },
          onDone: () => {
            setSending(false);
          },
          onError: (error) => {
            streamError = true;
            setSending(false);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.role === "ASSISTANT" && last.content === "") {
                return updated.slice(0, -1);
              }
              return updated;
            });
          },
        });

        if (streamError) {
          setMessages((prev) => prev.slice(0, -2));
        }
      } catch (err) {
        setMessages((prev) => prev.slice(0, -2));
        setSending(false);
      }
    },
    [key, sessionId, sending, ensureSession],
  );

  const handleReset = useCallback(() => {
    const sid = sessionId;
    setMessages([]);
    setSessionId(null);
    if (sid && key) {
      endPublicSession(key, sid).catch(() => {});
    }
  }, [sessionId, key]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <Loader2 size={24} className="animate-spin text-[#71717A]" />
      </div>
    );
  }

  if (configError || !config) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <p className="text-[13px] text-[#A1A1AA]">{configError || "Widget unavailable"}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-transparent p-6">
      <div className="h-[580px] w-[380px]">
        <ChatWidgetPreview
          config={config}
          mode="live"
          messages={messages}
          isStreaming={sending}
          onSend={handleSend}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}
