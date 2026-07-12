"use client";

import { useEffect, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useChatbotStore } from "@/store/chatbotStore";
import { ChatbotSidebar } from "@/components/chatbot/ChatbotSidebar";

export default function ChatbotLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();
  const router = useRouter();
  const workspaceId = params.workspaceId;
  const chatbotId = params.chatbotId;

  const currentChatbot = useChatbotStore((s) => s.currentChatbot);
  const isFetching = useChatbotStore((s) => s.isFetching);
  const fetchChatbot = useChatbotStore((s) => s.fetchChatbot);
  const clear = useChatbotStore((s) => s.clear);

  useEffect(() => {
    fetchChatbot(workspaceId, chatbotId).catch(() => {
      router.push(`/workspace/${workspaceId}/agents`);
    });
    return () => {
      clear();
    };
  }, [workspaceId, chatbotId, fetchChatbot, router, clear]);

  if (isFetching) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[#71717A]" />
      </div>
    );
  }

  if (!currentChatbot) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[#71717A]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        <ChatbotSidebar workspaceId={workspaceId} chatbotId={chatbotId} />
        <main className="flex-1 overflow-y-auto bg-[#FAFAFA]">
          {children}
        </main>
      </div>
    </div>
  );
}
