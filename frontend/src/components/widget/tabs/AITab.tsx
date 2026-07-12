"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function AITab() {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#71717A] leading-relaxed">
        AI behavior, system prompt, and model settings are configured in the
        chatbot settings.
      </p>
      <Link
        href={`/workspace/${params.workspaceId}/chatbot/${params.chatbotId}/settings`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4D4D8] bg-white px-4 py-2.5 text-[13px] font-medium text-[#0A0A0A] hover:bg-[#F4F4F5] transition-colors"
      >
        Go to AI settings
        <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
