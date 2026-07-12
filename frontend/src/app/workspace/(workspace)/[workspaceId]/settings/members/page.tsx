"use client";

import { useParams } from "next/navigation";
import { useMemberStore } from "@/store/memberStore";
import { MembersTable } from "@/components/members/MembersTable";
import { RolesPermissionsCard } from "@/components/members/RolesPermissionsCard";

export default function MembersPage() {
  const params = useParams<{ workspaceId: string }>();
  const members = useMemberStore((s) => s.members);

  return (
    <div className="mx-auto max-w-[640px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-[#0A0A0A]">Members</h1>
        <p className="mt-1 text-[13px] text-[#71717A]">
          Manage who has access to this workspace.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <MembersTable workspaceId={params.workspaceId} />
        <RolesPermissionsCard members={members} />
      </div>
    </div>
  );
}
