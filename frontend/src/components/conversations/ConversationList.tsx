"use client";

import { useRef, useCallback, useEffect } from "react";
import {
  SlidersHorizontal,
  RefreshCw,
  Ellipsis,
  Loader2,
} from "lucide-react";
import { useConversationStore } from "@/store/conversationStore";
import { ConversationListItem } from "./ConversationListItem";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface ConversationListProps {
  workspaceId: string;
  chatbotId?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  workspaceId,
  chatbotId,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const conversations = useConversationStore((s) => s.conversations);
  const hasMore = useConversationStore((s) => s.hasMore);
  const filters = useConversationStore((s) => s.filters);
  const isLoading = useConversationStore((s) => s.isLoadingConversations);
  const fetchConversations = useConversationStore((s) => s.fetchConversations);
  const fetchMore = useConversationStore((s) => s.fetchMoreConversations);
  const setFilters = useConversationStore((s) => s.setFilters);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          fetchMore(workspaceId, chatbotId);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, fetchMore, workspaceId, chatbotId]);

  const handleRefresh = useCallback(() => {
    fetchConversations(workspaceId, chatbotId);
  }, [fetchConversations, workspaceId, chatbotId]);

  const handleStatusFilter = useCallback(
    (status?: "active" | "resolved") => {
      setFilters({ status });
      setTimeout(() => fetchConversations(workspaceId, chatbotId), 0);
    },
    [setFilters, fetchConversations, workspaceId, chatbotId],
  );

  const currentFilter = filters.status ?? "all";

  return (
    <div className="flex h-full flex-col border-r border-[#E4E4E7]">
      <div className="flex items-center justify-between border-b border-[#E4E4E7] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-[#0A0A0A]">Chat logs</h2>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Filter conversations">
                  <SlidersHorizontal size={15} className="text-[#71717A]" />
                </Button>
              }
            />
            <PopoverContent align="end" sideOffset={6}>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleStatusFilter(undefined)}
                  className={`rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                    currentFilter === "all"
                      ? "bg-[#F4F4F5] font-medium text-[#0A0A0A]"
                      : "text-[#71717A] hover:bg-[#F4F4F5]"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusFilter("active")}
                  className={`rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                    currentFilter === "active"
                      ? "bg-[#F4F4F5] font-medium text-[#0A0A0A]"
                      : "text-[#71717A] hover:bg-[#F4F4F5]"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusFilter("resolved")}
                  className={`rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                    currentFilter === "resolved"
                      ? "bg-[#F4F4F5] font-medium text-[#0A0A0A]"
                      : "text-[#71717A] hover:bg-[#F4F4F5]"
                  }`}
                >
                  Resolved
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh conversations"
            disabled={isLoading}
            onClick={handleRefresh}
          >
            <RefreshCw
              size={15}
              className={`text-[#71717A] ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="More options" disabled>
            <Ellipsis size={15} className="text-[#71717A]" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-[#A1A1AA]" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-[13px] text-[#71717A]">
              No conversations yet.
            </p>
            <p className="mt-1 text-[12px] text-[#A1A1AA]">
              Customer conversations will appear here once users begin chatting
              with your chatbot.
            </p>
          </div>
        ) : (
          <>
            {conversations.map((c) => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                isSelected={selectedId === c.id}
                onClick={() => onSelect(c.id)}
              />
            ))}
            <div ref={sentinelRef} className="h-4" />
            {hasMore && (
              <div className="flex justify-center py-3">
                <Loader2 size={14} className="animate-spin text-[#A1A1AA]" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
