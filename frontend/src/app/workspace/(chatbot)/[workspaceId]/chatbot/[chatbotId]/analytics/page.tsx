"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getAnalytics } from "@/lib/api/chatbots";
import type { Analytics } from "@/lib/api/chatbots";

export default function AnalyticsPage() {
  const params = useParams<{ workspaceId: string; chatbotId: string }>();
  const workspaceId = params.workspaceId;
  const chatbotId = params.chatbotId;

  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    getAnalytics(workspaceId, chatbotId)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load analytics."),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId, chatbotId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[#71717A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
        <p className="text-[14px] text-[#EF4444]">{error}</p>
        <button
          type="button"
          onClick={fetchData}
          className="text-[13px] font-medium text-[#0A0A0A] hover:text-[#52525B] transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const trafficSources = [
    { label: "Widget", value: data.trafficSource.widget },
    { label: "Dashboard", value: data.trafficSource.dashboard },
    { label: "API", value: data.trafficSource.api },
  ];
  const maxTraffic = Math.max(
    data.trafficSource.widget,
    data.trafficSource.dashboard,
    data.trafficSource.api,
    1,
  );

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <h1 className="text-[16px] font-semibold text-[#0A0A0A]">Analytics</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#D4D4D8] bg-white px-5 py-4">
          <p className="text-[28px] font-bold text-[#0A0A0A]">
            {data.totalConversations}
          </p>
          <p className="mt-1 text-[12px] text-[#71717A]">
            Total conversations
          </p>
        </div>
        <div className="rounded-xl border border-[#D4D4D8] bg-white px-5 py-4">
          <p className="text-[28px] font-bold text-[#0A0A0A]">
            {data.totalMessages}
          </p>
          <p className="mt-1 text-[12px] text-[#71717A]">Total messages</p>
        </div>
        <div className="rounded-xl border border-[#D4D4D8] bg-white px-5 py-4">
          <p className="text-[28px] font-bold text-[#0A0A0A]">
            {data.avgConversationLength.toFixed(1)}
          </p>
          <p className="mt-1 text-[12px] text-[#71717A]">
            Avg. conversation length
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#D4D4D8] bg-white">
        <div className="px-5 py-4">
          <h2 className="text-[14px] font-semibold text-[#0A0A0A]">
            Traffic source
          </h2>
        </div>
        <div className="border-t border-[#D4D4D8] px-5 py-4">
          <div className="flex flex-col gap-3">
            {trafficSources.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-20 text-[13px] text-[#71717A]">
                  {item.label}
                </span>
                <div className="flex flex-1 items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-[#F4F4F5]">
                    <div
                      className="h-full rounded-full bg-[#0A0A0A] transition-all"
                      style={{
                        width: `${(item.value / maxTraffic) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-[13px] font-medium text-[#0A0A0A]">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
