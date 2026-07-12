import { create } from "zustand";
import {
  getMembers as apiGetMembers,
  inviteMember as apiInviteMember,
  changeMemberRole as apiChangeMemberRole,
  removeMember as apiRemoveMember,
  type WorkspaceMember,
} from "@/lib/api/members";

interface MemberStore {
  members: WorkspaceMember[];
  isLoading: boolean;
  error: string | null;

  fetchMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (
    workspaceId: string,
    data: { email: string; role: "ADMIN" | "VIEWER" },
  ) => Promise<void>;
  changeMemberRole: (
    workspaceId: string,
    memberId: string,
    role: "ADMIN" | "VIEWER",
  ) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;
}

export const useMemberStore = create<MemberStore>((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  fetchMembers: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { members } = await apiGetMembers(workspaceId);
      set({ members, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load members.",
        isLoading: false,
      });
    }
  },

  inviteMember: async (workspaceId, data) => {
    await apiInviteMember(workspaceId, data);
    await get().fetchMembers(workspaceId);
  },

  changeMemberRole: async (workspaceId, memberId, role) => {
    await apiChangeMemberRole(workspaceId, memberId, role);
    await get().fetchMembers(workspaceId);
  },

  removeMember: async (workspaceId, memberId) => {
    await apiRemoveMember(workspaceId, memberId);
    await get().fetchMembers(workspaceId);
  },
}));
