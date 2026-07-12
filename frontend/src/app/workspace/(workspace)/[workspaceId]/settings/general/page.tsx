"use client";

import { useParams } from "next/navigation";
import { GeneralSettingsForm } from "@/components/workspace/GeneralSettingsForm";

export default function GeneralSettingsPage() {
  const params = useParams<{ workspaceId: string }>();

  return (
    <div className="mx-auto max-w-[640px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-[#0A0A0A]">General</h1>
        <p className="mt-1 text-[13px] text-[#71717A]">
          Manage your workspace settings.
        </p>
      </div>
      <GeneralSettingsForm workspaceId={params.workspaceId} />
    </div>
  );
}
