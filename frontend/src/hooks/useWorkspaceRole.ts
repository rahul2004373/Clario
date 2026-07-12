"use client";

import { useWorkspaceStore } from "@/store/workspaceStore";

export function useWorkspaceRole() {
  const role = useWorkspaceStore((s) => s.currentUserRole);

  return {
    role,
    canEdit: role === "OWNER" || role === "ADMIN",
    canDelete: role === "OWNER",
    canInvite: role === "OWNER" || role === "ADMIN",
  };
}
