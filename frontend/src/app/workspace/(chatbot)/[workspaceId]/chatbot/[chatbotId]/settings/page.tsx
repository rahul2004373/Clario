"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { AgentDetailsForm } from "@/components/chatbot/AgentDetailsForm";
import { AISettingsForm } from "@/components/chatbot/AISettingsForm";
import { PublishToggle } from "@/components/chatbot/PublishToggle";
import { useChatbotStore } from "@/store/chatbotStore";

const TABS = [
  { id: "general", label: "General" },
  { id: "ai", label: "AI" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();
  const workspaceId = params.workspaceId;
  const chatbotId = params.chatbotId;
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const currentChatbot = useChatbotStore((s) => s.currentChatbot);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#D4D4D8] bg-white">
        <div className="flex gap-0 overflow-x-auto px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative whitespace-nowrap px-4 py-3 text-[13px] font-medium transition-colors",
                activeTab === tab.id
                  ? "text-[#0A0A0A]"
                  : "text-[#71717A] hover:text-[#0A0A0A]",
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A0A0A]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-6">
          {activeTab === "general" && (
            <div className="flex flex-col gap-6">
              <AgentDetailsForm
                workspaceId={workspaceId}
                chatbotId={chatbotId}
              />
              {currentChatbot && (
                <div className="rounded-xl border border-[#D4D4D8] bg-white px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-medium text-[#0A0A0A]">
                        Publishing
                      </h3>
                      <p className="mt-0.5 text-[12px] text-[#71717A]">
                        Make this agent available to users.
                      </p>
                    </div>
                    <PublishToggle
                      workspaceId={workspaceId}
                      chatbotId={chatbotId}
                      isPublished={currentChatbot.isPublished}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "ai" && (
            <AISettingsForm
              workspaceId={workspaceId}
              chatbotId={chatbotId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
