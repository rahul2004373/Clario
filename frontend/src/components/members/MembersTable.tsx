"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, AlertTriangle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useMemberStore } from "@/store/memberStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { MemberRoleMenu } from "@/components/members/MemberRoleMenu";
import { InviteMemberDialog } from "@/components/members/InviteMemberDialog";
import type { WorkspaceMember } from "@/lib/api/members";

interface MembersTableProps {
  workspaceId: string;
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#F4F4F5] px-2.5 py-0.5 text-[12px] font-medium text-[#0A0A0A]">
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-[#E4E4E7]">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function MembersTable({ workspaceId }: MembersTableProps) {
  const router = useRouter();
  const members = useMemberStore((s) => s.members);
  const isLoading = useMemberStore((s) => s.isLoading);
  const error = useMemberStore((s) => s.error);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);
  const { canInvite } = useWorkspaceRole();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const currentUserRole = useWorkspaceStore((s) => s.currentUserRole);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<WorkspaceMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspaceId === workspaceId) {
      fetchMembers(workspaceId);
    }
  }, [workspaceId, currentWorkspaceId, fetchMembers]);

  const memberStore = useMemberStore;

  const handleRemove = async () => {
    if (!removeTarget) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await memberStore.getState().removeMember(workspaceId, removeTarget.id);
      setRemoveTarget(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to remove member.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: "ADMIN" | "VIEWER") => {
    setActionLoading(true);
    setActionError(null);
    try {
      await memberStore.getState().changeMemberRole(workspaceId, memberId, role);
      setRoleChangeTarget(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to change role.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const currentUserId = useUserStore((s) => s.user?.id);
  const canEdit = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  return (
    <>
      <div className="rounded-xl border border-[#D4D4D8] bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-[#0A0A0A]">
              Manage
            </h2>
            <span className="text-[13px] text-[#71717A]">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          </div>
          {canInvite && (
            <Button
              type="button"
              size="sm"
              onClick={() => setInviteOpen(true)}
            >
              <Plus size={15} className="mr-1" />
              Invite members
            </Button>
          )}
        </div>

        {error && (
          <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#EF4444]">
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => fetchMembers(workspaceId)}
              className="font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {actionError && (
          <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg border border-[#EF4444]/20 bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#EF4444]">
            {actionError}
          </div>
        )}

        <div className="border-t border-[#D4D4D8]">
          {/* Header row */}
          <div className="flex items-center gap-3 px-5 py-2.5 bg-[#FAFAFA] text-[12px] font-medium text-[#71717A] uppercase tracking-wider">
            <div className="flex flex-1 items-center gap-3">
              <span className="w-8" />
              <span>User</span>
            </div>
            <span className="w-24">Role</span>
            <span className="w-8" />
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : members.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-[#71717A]">
              No members found.
            </div>
          ) : (
            <div className="divide-y divide-[#E4E4E7]">
              {members.map((m) => {
                const isSelf = m.userId === currentUserId;
                const isOwnerRow = m.role === "OWNER";
                const showMenu =
                  canEdit &&
                  !isSelf &&
                  !(isOwnerRow && currentUserRole === "ADMIN");

                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <UserAvatar
                      name={m.user.name}
                      email={m.user.email}
                      avatarUrl={m.user.avatarUrl}
                      size={8}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-[#0A0A0A]">
                        {m.user.name || m.user.email}
                      </p>
                      {m.user.name && (
                        <p className="truncate text-[12px] text-[#71717A]">
                          {m.user.email}
                        </p>
                      )}
                    </div>
                    <div className="w-24 shrink-0">
                      <RoleBadge role={m.role} />
                    </div>
                    <div className="w-8 shrink-0">
                      {showMenu ? (
                        <MemberRoleMenu
                          onChangeRole={() => setRoleChangeTarget(m)}
                          onRemove={() => setRemoveTarget(m)}
                          isOwner={isOwnerRow}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        workspaceId={workspaceId}
      />

      {/* Role change inline UI */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !actionLoading && setRoleChangeTarget(null)}
          />
          <div className="relative z-10 w-full max-w-[360px] rounded-xl border border-[#D4D4D8] bg-white p-6 shadow-lg">
            <h3 className="text-[16px] font-semibold text-[#0A0A0A]">
              Change role
            </h3>
            <p className="mt-1 text-[13px] text-[#71717A]">
              Select a new role for{" "}
              <strong className="text-[#0A0A0A]">
                {roleChangeTarget.user.name || roleChangeTarget.user.email}
              </strong>
              .
            </p>
            <div className="mt-4 flex gap-2">
              {(["ADMIN", "VIEWER"] as const).map((r) => {
                const isCurrent = r === roleChangeTarget.role;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={actionLoading || isCurrent}
                    onClick={() => handleRoleChange(roleChangeTarget.id, r)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                      isCurrent
                        ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                        : "border-[#D4D4D8] bg-white text-[#71717A] hover:border-[#A1A1AA] hover:text-[#0A0A0A]"
                    }`}
                  >
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
            {actionError && (
              <p className="mt-3 text-[12px] text-[#EF4444]">{actionError}</p>
            )}
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={() => setRoleChangeTarget(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove member confirmation */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !actionLoading && setRemoveTarget(null)}
          />
          <div className="relative z-10 w-full max-w-[400px] rounded-xl border border-[#D4D4D8] bg-white p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FEF2F2]">
                <AlertTriangle size={18} className="text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#0A0A0A]">
                  Remove member
                </h3>
                <p className="mt-1 text-[13px] text-[#71717A]">
                  Remove{" "}
                  <strong className="text-[#0A0A0A]">
                    {removeTarget.user.name || removeTarget.user.email}
                  </strong>{" "}
                  from this workspace? They will lose access to all workspace
                  data.
                </p>
              </div>
            </div>
            {actionError && (
              <p className="mt-3 text-[12px] text-[#EF4444]">{actionError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={() => setRemoveTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={actionLoading}
                onClick={handleRemove}
              >
                {actionLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Remove"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
