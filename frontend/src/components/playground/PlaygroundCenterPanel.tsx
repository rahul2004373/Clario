"use client";

import { useParams } from "next/navigation";
import { usePlayground } from "@/hooks/usePlayground";
import { useChatbotStore } from "@/store/chatbotStore";
import { PlaygroundConfigPanel } from "./PlaygroundConfigPanel";
import { ChatWidgetPreview } from "./ChatWidgetPreview";

export function PlaygroundCenterPanel() {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();
  const workspaceId = params.workspaceId;
  const chatbotId = params.chatbotId;

  const chatbot = useChatbotStore((s) => s.currentChatbot);

  const {
    messages,
    welcomeMessage,
    isStreaming,
    isInitialising,
    error,
    sendMessage,
    clearChat,
  } = usePlayground(workspaceId, chatbotId);

  return (
    <div className="flex h-full">
      {/* Left: Config panel */}
      <div className="w-[460px] shrink-0 border-r border-[#E4E4E7] bg-white">
        <PlaygroundConfigPanel workspaceId={workspaceId} chatbotId={chatbotId} />
      </div>

      {/* Right: Preview panel - fixed, no scroll */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#F4F4F5] bg-[radial-gradient(#D4D4D8_1px,transparent_1px)] bg-[length:16px_16px]">
        {error && (
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            {error}
          </div>
        )}

        {isInitialising ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2 animate-bounce rounded-full bg-[#A1A1AA] [animation-delay:0ms]" />
              <span className="size-2 animate-bounce rounded-full bg-[#A1A1AA] [animation-delay:150ms]" />
              <span className="size-2 animate-bounce rounded-full bg-[#A1A1AA] [animation-delay:300ms]" />
            </div>
            <p className="text-[13px] text-[#71717A]">Starting session...</p>
          </div>
        ) : (
          <ChatWidgetPreview
            messages={messages}
            welcomeMessage={welcomeMessage}
            isStreaming={isStreaming}
            onSend={sendMessage}
            onClear={clearChat}
            disabled={isInitialising}
            chatbotName={chatbot?.name}
          />
        )}
      </div>
    </div>
  );
}
