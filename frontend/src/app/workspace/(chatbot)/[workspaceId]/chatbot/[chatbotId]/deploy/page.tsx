"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EmbedCodeCard } from "@/components/chatbot/EmbedCodeCard";

export default function DeployPage() {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();
  const workspaceId = params.workspaceId;
  const chatbotId = params.chatbotId;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <h1 className="text-[18px] font-semibold text-[#0A0A0A]">Deploy</h1>
        <p className="text-[12px] text-[#71717A]">
          Integrate your chatbot into your website.
        </p>
      </div>
      <EmbedCodeCard workspaceId={workspaceId} chatbotId={chatbotId} />
      <div className="mt-4 text-right">
        <Link
          href={`/workspace/${workspaceId}/chatbot/${chatbotId}/widgets`}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0A0A0A] hover:underline"
        >
          Customize widget appearance
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
