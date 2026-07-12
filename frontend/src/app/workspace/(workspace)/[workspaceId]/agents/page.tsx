"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatbotStore } from "@/store/chatbotStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { ChatbotCard } from "@/components/chatbot/ChatbotCard";
import { CreateChatbotDialog } from "@/components/chatbot/CreateChatbotDialog";

export default function AgentsPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const { canEdit } = useWorkspaceRole();

  const chatbots = useChatbotStore((s) => s.chatbots);
  const isLoading = useChatbotStore((s) => s.isLoading);
  const error = useChatbotStore((s) => s.error);
  const fetchChatbots = useChatbotStore((s) => s.fetchChatbots);
  const clear = useChatbotStore((s) => s.clear);

  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchChatbots(workspaceId);
    return () => {
      clear();
    };
  }, [workspaceId, fetchChatbots, clear]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#D4D4D8] px-6 py-3">
        <h1 className="text-[16px] font-semibold text-[#0A0A0A]">Agents</h1>
        {canEdit && (
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            size="sm"
          >
            <Plus size={16} />
            New AI agent
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-[#71717A]" />
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6">
          <p className="text-[14px] text-[#EF4444]">{error}</p>
          <button
            type="button"
            onClick={() => fetchChatbots(workspaceId)}
            className="text-[13px] font-medium text-[#0A0A0A] hover:text-[#52525B] transition-colors"
          >
            Try again
          </button>
        </div>
      ) : chatbots.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F4F5]">
            <Bot size={24} className="text-[#A1A1AA]" />
          </div>
          <div className="text-center">
            <h2 className="text-[15px] font-medium text-[#0A0A0A]">
              No agents yet
            </h2>
            <p className="mt-1 text-[13px] text-[#71717A] max-w-[320px]">
              Create your first AI agent to get started. Agents can be trained
              on your data and deployed across multiple channels.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {chatbots.map((chatbot) => (
            <ChatbotCard
              key={chatbot.id}
              chatbot={chatbot}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}

      <CreateChatbotDialog
        workspaceId={workspaceId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
