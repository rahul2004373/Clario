"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatbotStore } from "@/store/chatbotStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { getLastTrained } from "@/lib/api/chatbots";
import type { Chatbot } from "@/lib/api/chatbots";

interface ChatbotCardProps {
  chatbot: Chatbot;
  workspaceId: string;
}

function getChatbotGradient(id: string): string {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const isOrange = sum % 2 === 0;
  return isOrange
    ? "bg-gradient-to-br from-[#FFEDD5] via-[#FED7AA] to-[#FDE68A]"
    : "bg-gradient-to-br from-[#F3E8FF] via-[#E9D5FF] to-[#DDD6FE]";
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ChatbotCard({ chatbot, workspaceId }: ChatbotCardProps) {
  const router = useRouter();
  const { canEdit } = useWorkspaceRole();
  const deleteChatbot = useChatbotStore((s) => s.deleteChatbot);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [lastTrained, setLastTrained] = useState<string | null>(null);
  const [loadingTrained, setLoadingTrained] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getLastTrained(workspaceId, chatbot.id)
      .then((res) => {
        if (!cancelled) {
          setLastTrained(res.lastTrainedAt);
          setLoadingTrained(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingTrained(false);
      });
    return () => { cancelled = true; };
  }, [workspaceId, chatbot.id]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteChatbot(workspaceId, chatbot.id);
    } catch {
      setDeleting(false);
    }
  };

  const handleCardClick = () => {
    router.push(
      `/workspace/${workspaceId}/chatbot/${chatbot.id}/playground`,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[#D4D4D8] bg-white text-left transition-all hover:border-[#0A0A0A]/30 hover:shadow-sm active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]/10"
    >
      <div className={`h-32 w-full ${getChatbotGradient(chatbot.id)}`} />

      <div className="flex flex-col gap-1 px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-semibold text-[#0A0A0A] truncate">
            {chatbot.name}
          </h3>

          {canEdit && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#A1A1AA] opacity-0 transition-all hover:bg-[#F4F4F5] hover:text-[#0A0A0A] group-hover:opacity-100"
              >
                <MoreHorizontal size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-40 rounded-lg bg-white p-1 shadow-md ring-1 ring-[#0A0A0A]/10"
              >
                <DropdownMenuItem
                  disabled={deleting}
                  onClick={handleDelete}
                  className="rounded-lg px-3 py-2 text-[13px] text-[#EF4444] focus:text-[#EF4444] cursor-pointer"
                >
                  {deleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <p className="text-[12px] text-[#A1A1AA]">
          {loadingTrained
            ? "Loading..."
            : lastTrained
              ? `Last trained ${relativeTime(lastTrained)}`
              : "Not trained yet"}
        </p>


      </div>
    </div>
  );
}
