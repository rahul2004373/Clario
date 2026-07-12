"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useChatbotStore } from "@/store/chatbotStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";

interface PublishToggleProps {
  chatbotId: string;
  workspaceId: string;
  isPublished: boolean;
}

export function PublishToggle({
  chatbotId,
  workspaceId,
  isPublished,
}: PublishToggleProps) {
  const publishChatbot = useChatbotStore((s) => s.publishChatbot);
  const { canEdit } = useWorkspaceRole();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (!canEdit || toggling) return;
    setToggling(true);
    try {
      await publishChatbot(workspaceId, chatbotId, !isPublished);
    } catch {
    } finally {
      setToggling(false);
    }
  };

  return (
    <button
      type="button"
      disabled={!canEdit || toggling}
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
        isPublished
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {toggling ? (
        <Loader2 size={12} className="animate-spin" />
      ) : null}
      {isPublished ? "Published" : "Draft"}
    </button>
  );
}
