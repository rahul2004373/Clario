"use client";

import { useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { useConversationStore } from "@/store/conversationStore";
import { ConversationList } from "@/components/conversations/ConversationList";
import { ConversationDetailsPanel } from "@/components/conversations/ConversationDetailsPanel";

export default function ChatLogsPage() {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();
  const workspaceId = params.workspaceId;
  const chatbotId = params.chatbotId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation");

  const { canDelete } = useWorkspaceRole();

  const conversations = useConversationStore((s) => s.conversations);
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation,
  );
  const fetchConversations = useConversationStore((s) => s.fetchConversations);
  const fetchConversationDetails = useConversationStore(
    (s) => s.fetchConversationDetails,
  );
  const fetchMessages = useConversationStore((s) => s.fetchMessages);
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation,
  );

  useEffect(() => {
    fetchConversations(workspaceId, chatbotId);
  }, [workspaceId, chatbotId, fetchConversations]);

  useEffect(() => {
    const storeConv = conversations.find((c) => c.id === conversationId);
    if (conversationId && storeConv) {
      setSelectedConversation(storeConv);
      fetchConversationDetails(workspaceId, conversationId);
      fetchMessages(workspaceId, conversationId);
    } else if (conversationId && !storeConv && conversations.length > 0) {
      // The conversation ID was set but isn't in our current list
      fetchConversationDetails(workspaceId, conversationId);
      fetchMessages(workspaceId, conversationId);
    } else if (!conversationId) {
      setSelectedConversation(null);
    }
  }, [
    conversationId,
    conversations,
    workspaceId,
    fetchConversationDetails,
    fetchMessages,
    setSelectedConversation,
  ]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      const current = new URLSearchParams(searchParams.toString());
      current.set("conversation", id);
      router.replace(`?${current.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleDeleteConversation = useCallback(() => {
    const current = new URLSearchParams(searchParams.toString());
    current.delete("conversation");
    router.replace(`?${current.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <div className="flex h-full">
      <div className="w-[320px] shrink-0">
        <ConversationList
          workspaceId={workspaceId}
          chatbotId={chatbotId}
          selectedId={conversationId}
          onSelect={handleSelectConversation}
        />
      </div>
      <div className="flex-1 bg-white">
        {selectedConversation && conversationId ? (
          <ConversationDetailsPanel
            workspaceId={workspaceId}
            conversation={selectedConversation}
            canDelete={canDelete}
            onDelete={handleDeleteConversation}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-[13px] text-[#A1A1AA]">
              Select a conversation to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
