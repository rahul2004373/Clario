"use client";

import { useState, useCallback } from "react";
import {
  Ellipsis,
  Loader2,
  Check,
  RefreshCw,
} from "lucide-react";
import { useConversationStore } from "@/store/conversationStore";
import { ConversationDeleteDialog } from "./ConversationDeleteDialog";
import { ChatTranscript } from "./ChatTranscript";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { exportConversation } from "@/lib/api/conversations";
import type { Conversation } from "@/lib/api/conversations";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface ConversationDetailsPanelProps {
  workspaceId: string;
  conversation: Conversation;
  canDelete: boolean;
  onDelete: () => void;
}

export function ConversationDetailsPanel({
  workspaceId,
  conversation,
  canDelete,
  onDelete,
}: ConversationDetailsPanelProps) {
  const [tab, setTab] = useState<"chat" | "details">("chat");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const messages = useConversationStore(
    (s) => s.messagesMap[conversation.id],
  );
  const isLoadingMessages = useConversationStore((s) => s.isLoadingMessages);
  const fetchMessages = useConversationStore((s) => s.fetchMessages);
  const fetchConversationDetails = useConversationStore(
    (s) => s.fetchConversationDetails,
  );
  const updateStatus = useConversationStore((s) => s.updateStatus);
  const deleteConversationAction = useConversationStore(
    (s) => s.deleteConversation,
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportConversation(workspaceId, conversation.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcript-${conversation.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }, [workspaceId, conversation.id]);

  const handleDelete = useCallback(async () => {
    await deleteConversationAction(workspaceId, conversation.id);
    setDeleteOpen(false);
    onDelete();
  }, [workspaceId, conversation.id, deleteConversationAction, onDelete]);

  const handleResolve = useCallback(async () => {
    await updateStatus(workspaceId, conversation.id, { isResolved: true });
    fetchConversationDetails(workspaceId, conversation.id);
  }, [workspaceId, conversation.id, updateStatus, fetchConversationDetails]);

  const handleReopen = useCallback(async () => {
    await updateStatus(workspaceId, conversation.id, { isResolved: false });
    fetchConversationDetails(workspaceId, conversation.id);
  }, [workspaceId, conversation.id, updateStatus, fetchConversationDetails]);

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(conversation.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [conversation.id]);

  const status =
    conversation.isActive && !conversation.resolvedAt
      ? "Ongoing"
      : "Resolved";

  const messageCount = messages?.length ?? 0;

  const isResolved = !!conversation.resolvedAt;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#E4E4E7] px-5 py-3">
        <h2 className="truncate text-[15px] font-semibold text-[#0A0A0A]">
          {conversation.sessionId || `Conversation ${conversation.id.slice(0, 8)}`}
        </h2>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Conversation actions">
                  <Ellipsis size={15} className="text-[#71717A]" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" sideOffset={6}>
              <DropdownMenuItem onClick={handleExport} disabled={exporting}>
                {exporting ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <span className="mr-1.5">📄</span>
                )}
                Export PDF
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-0 border-b border-[#E4E4E7] px-5">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={`px-3 py-2.5 text-[13px] font-medium transition-colors ${
            tab === "chat"
              ? "border-b-2 border-[#0A0A0A] text-[#0A0A0A]"
              : "text-[#71717A] hover:text-[#0A0A0A]"
          }`}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("details");
            if (!messages) {
              fetchMessages(workspaceId, conversation.id);
            }
          }}
          className={`px-3 py-2.5 text-[13px] font-medium transition-colors ${
            tab === "details"
              ? "border-b-2 border-[#0A0A0A] text-[#0A0A0A]"
              : "text-[#71717A] hover:text-[#0A0A0A]"
          }`}
        >
          Details
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {tab === "chat" ? (
          <ChatTranscript
            messages={messages ?? []}
            isLoading={isLoadingMessages}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              <div>
                <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  General Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#71717A]">Status</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                        isResolved
                          ? "bg-[#F0FDF4] text-[#16A34A]"
                          : "bg-[#F0F9FF] text-[#2563EB]"
                      }`}
                    >
                      {isResolved ? (
                        <Check size={12} />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#71717A]">Messages</span>
                    <span className="text-[13px] font-medium text-[#0A0A0A]">
                      {messageCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#71717A]">Created</span>
                    <span className="text-[13px] text-[#0A0A0A]">
                      {formatDate(conversation.startedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#71717A]">
                      Last activity
                    </span>
                    <span className="text-[13px] text-[#0A0A0A]">
                      {timeAgo(conversation.lastActivityAt)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#71717A]">
                      Conversation ID
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="flex items-center gap-1 text-[13px] font-mono text-[#0A0A0A] hover:text-[#71717A]"
                    >
                      {conversation.id.slice(0, 12)}...
                      {copied ? (
                        <Check size={12} className="text-[#16A34A]" />
                      ) : (
                        <span className="text-[10px] text-[#A1A1AA]">
                          Copy
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Actions
                </h3>
                {isResolved ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleReopen}
                  >
                    Reopen conversation
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={handleResolve}
                  >
                    Resolve conversation
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConversationDeleteDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
