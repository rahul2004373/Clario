import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChatLogsTab({ chatbotId }: { chatbotId: string }) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  const { data: conversations, isLoading: isLoadingList } = useQuery({
    queryKey: ["conversations", chatbotId],
    queryFn: async () => {
      const res = await api.get(`/v1/chatbots/${chatbotId}/conversations`);
      return res.data.data || res.data;
    },
  });

  const { data: conversationDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["conversation", chatbotId, selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return null;
      const res = await api.get(`/v1/chatbots/${chatbotId}/conversations/${selectedConversationId}`);
      return res.data.data || res.data;
    },
    enabled: !!selectedConversationId,
  });

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setShowListOnMobile(false);
  };

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div
        className={cn(
          "w-full shrink-0 border-r border-border bg-muted/10 md:w-[360px] xl:w-[400px]",
          showListOnMobile ? "flex" : "hidden md:flex",
          "flex-col"
        )}
      >
        <div className="border-b border-border px-5 py-5">
          <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
            Chat logs
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {isLoadingList ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading conversations...
              </div>
            </div>
          ) : conversations?.length === 0 ? (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-background px-6 text-center">
              <div>
                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sessions will appear here when users start chatting.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations?.map((conv: any) => {
                const isActive = selectedConversationId === conv.id;
                const timestamp = conv.updatedAt || conv.createdAt;
                const preview =
                  conv.lastMessage ||
                  conv.title ||
                  `Session ${conv.id.substring(0, 8)}...`;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-all",
                      isActive
                        ? "border-primary/20 bg-primary/5"
                        : "border-transparent bg-transparent hover:border-border hover:bg-background"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {preview}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {conv.firstMessagePreview ||
                            conv.userMessage ||
                            `Conversation ${conv.id.substring(0, 12)}...`}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timestamp
                          ? new Date(timestamp).toLocaleDateString([], {
                            day: "numeric",
                            month: "short",
                          })
                          : ""}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 flex-col bg-background",
          showListOnMobile ? "hidden md:flex" : "flex"
        )}
      >
        {!selectedConversationId ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-md text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Select a conversation
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Choose a conversation from the left panel to inspect its messages.
              </p>
            </div>
          </div>
        ) : isLoadingDetail ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading messages...
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-border bg-background px-4 py-4 md:px-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl md:hidden"
                    onClick={() => setShowListOnMobile(true)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      Chat logs
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {conversationDetail?.status || "Conversation detail"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-background px-4 py-6 md:px-7">
              <div className="mx-auto flex max-w-4xl flex-col gap-6">
                {conversationDetail?.messages?.length === 0 ? (
                  <div className="flex h-[60vh] items-center justify-center text-center">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        No messages in this session
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        This conversation exists but contains no chat history.
                      </p>
                    </div>
                  </div>
                ) : (
                  conversationDetail?.messages?.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className="max-w-[92%] sm:max-w-[78%]">
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 text-sm leading-6",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-muted/30 text-foreground"
                          )}
                        >
                          <div className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </div>

                          <div
                            className={cn(
                              "mt-3 text-[11px]",
                              msg.role === "user"
                                ? "text-right text-primary-foreground/70"
                                : "text-left text-muted-foreground"
                            )}
                          >
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleString()
                              : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}