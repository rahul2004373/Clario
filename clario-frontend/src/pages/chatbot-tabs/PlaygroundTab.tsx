import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Send,
  Bot,
  User,
  Loader2,
  RotateCcw,
  Clock3,
  FileText,
} from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormattedMessage } from "@/components/FormattedMessage";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function PlaygroundTab({
  chatbotId,
  workspaceId,
}: {
  chatbotId: string;
  workspaceId: string;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const isResizing = useRef(false);

  const { data: botInfo } = useQuery({
    queryKey: ["chatbot", chatbotId],
    queryFn: async () => {
      const res = await api.get(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}`);
      return res.data.data || res.data;
    },
  });

  const { data: lastTrainedData } = useQuery({
    queryKey: ["chatbot-last-trained", chatbotId],
    queryFn: async () => {
      try {
        const res = await api.get(`/v1/workspaces/${workspaceId}/chatbots/${chatbotId}/last-trained`);
        return res.data;
      } catch (err) {
        console.error("Error fetching last trained time:", err);
        return { lastTrainedAt: null };
      }
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I am ready to test. What would you like to know?",
      },
    ]);
  }, [chatbotId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Resizing Logic
  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = mouseMoveEvent.clientX;
      // Constrain sidebar width between 300px and 700px
      if (newWidth > 300 && newWidth < 700) {
        setSidebarWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: userMsg }]);
    setLoading(true);

    try {
      let activeConversationId = conversationId;

      if (!activeConversationId) {
        const initRes = await api.post(`/v1/chatbots/${chatbotId}/conversations`);
        activeConversationId = initRes.data.id;
        setConversationId(activeConversationId);
      }

      const res = await api.post(
        `/v1/chatbots/${chatbotId}/conversations/${activeConversationId}/messages`,
        {
          message: userMsg,
          stream: false,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "1",
          role: "assistant",
          content: res.data.response || "Sorry, I could not generate a response.",
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "1",
          role: "assistant",
          content: `Error: ${err.response?.data?.error?.message || "Something went wrong"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (conversationId) {
      api.post(`/v1/chatbots/${chatbotId}/conversations/${conversationId}/close`).catch(() => { });
    }

    setConversationId(null);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I am ready to test. What would you like to know?",
      },
    ]);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">

      {/* SIDEBAR */}
      <div
        className="hidden flex-col bg-muted/10 lg:flex"
        style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}
      >
        <div className="flex-1 overflow-y-auto p-6 xl:p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Playground
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Test and interact with your configured chatbot before deploying.
              </p>
            </div>

            <div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-card p-5 shadow-sm xl:p-6">

              {/* Bot Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold text-foreground">
                    {botInfo?.name || "Loading chatbot..."}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    Workspace Bot
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/30">
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                    Trained Status
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground xl:text-sm">
                    {lastTrainedData?.lastTrainedAt
                      ? new Date(lastTrainedData.lastTrainedAt).toLocaleString()
                      : "Not trained / No sources READY"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/30">
                  <div className="mb-2 flex items-center gap-2 text-sm text-foreground">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <span className="font-medium">Created</span>
                  </div>
                  <p className="text-xs text-muted-foreground xl:text-sm">
                    {botInfo?.createdAt
                      ? new Date(botInfo.createdAt).toLocaleString()
                      : "Loading..."}
                  </p>
                </div>
              </div>

              {/* Scrollable Prompt Summary */}
              <div className="flex flex-col rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/30">
                <div className="mb-3 flex items-center gap-2 text-sm text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">Prompt summary</span>
                </div>
                <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {botInfo?.systemPrompt || "No system prompt defined."}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* DRAG HANDLE */}
      <div
        className="group relative hidden w-1 cursor-col-resize items-center justify-center border-l border-border/60 transition-colors hover:bg-primary/20 active:bg-primary/40 lg:flex"
        onMouseDown={startResizing}
      >
        <div className="absolute flex h-8 w-1.5 items-center justify-center rounded-full bg-border opacity-0 transition-opacity group-hover:opacity-100 group-active:bg-primary"></div>
      </div>

      {/* PLAYGROUND AREA */}
      <div className="flex h-full min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#faf8ff] bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.10),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.08),transparent_22%),linear-gradient(to_right,rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:auto,auto,24px_24px,24px_24px] p-4 sm:p-6 xl:p-8">
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-[720px] w-full max-w-[430px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between border-b border-white/10 bg-[linear-gradient(180deg,#1c1c22_0%,#0d0d11_100%)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {botInfo?.name || "Launchpad"}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-9 w-9 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-[#15151b] text-white"
                    )}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <FormattedMessage content={msg.content} />
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex items-center rounded-2xl bg-[#15151b] px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-white/70" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="border-t border-white/10 bg-black px-4 py-4">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0f0f14] px-3 py-2">
                <Input
                  placeholder="Message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="h-10 flex-1 border-0 bg-transparent px-1 text-sm text-white placeholder:text-white/35 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !input.trim()}
                  className="h-9 w-9 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}