import { create } from "zustand";
import {
  getWorkspaces,
  createWorkspace as apiCreateWorkspace,
  updateWorkspace as apiUpdateWorkspace,
  deleteWorkspace as apiDeleteWorkspace,
  type Workspace,
  type WorkspaceRole,
} from "@/lib/api/workspace";
import { UnauthorizedError, ForbiddenError } from "@/lib/api/client";

const WORKSPACE_ID_KEY = "currentWorkspaceId";

export interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentWorkspaceId: string | null;
  currentUserRole: WorkspaceRole | null;
  isLoading: boolean;
  error: string | null;
  isUnauthorized: boolean;

  fetchWorkspaces(): Promise<void>;
  setCurrentWorkspace(id: string): void;
  createWorkspace(data: { name: string }): Promise<Workspace>;
  updateWorkspace(id: string, data: { name?: string; logoUrl?: string; website?: string }): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;
  clear(): void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  currentWorkspaceId:
    typeof window !== "undefined"
      ? localStorage.getItem(WORKSPACE_ID_KEY)
      : null,
  currentUserRole: null,
  isLoading: false,
  error: null,
  isUnauthorized: false,

  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(WORKSPACE_ID_KEY);
    }
    set({
      workspaces: [],
      currentWorkspace: null,
      currentWorkspaceId: null,
      currentUserRole: null,
      isLoading: false,
      error: null,
      isUnauthorized: false,
    });
  },

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null, isUnauthorized: false });
    try {
      const { workspaces } = await getWorkspaces();
      const storedId = get().currentWorkspaceId;
      const stillValid = storedId && workspaces.some((w) => w.id === storedId);

      if (stillValid) {
        const ws = workspaces.find((w) => w.id === storedId)!;
        const role = ws.members?.[0]?.role ?? null;
        set({ workspaces, currentWorkspace: ws, currentWorkspaceId: storedId, currentUserRole: role, isLoading: false });
      } else if (workspaces.length > 0) {
        const ws = workspaces[0];
        const role = ws.members?.[0]?.role ?? null;
        if (typeof window !== "undefined") {
          localStorage.setItem(WORKSPACE_ID_KEY, ws.id);
        }
        set({ workspaces, currentWorkspace: ws, currentWorkspaceId: ws.id, currentUserRole: role, isLoading: false });
      } else {
        set({ workspaces, currentWorkspace: null, currentWorkspaceId: null, currentUserRole: null, isLoading: false });
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(WORKSPACE_ID_KEY);
        }
        set({ workspaces: [], currentWorkspace: null, currentWorkspaceId: null, currentUserRole: null, isLoading: false, isUnauthorized: true });
      } else if (err instanceof ForbiddenError) {
        set({ error: err.message, isLoading: false });
      } else {
        set({ error: "Failed to load workspaces. Please try again.", isLoading: false });
      }
    }
  },

  setCurrentWorkspace: (id: string) => {
    const ws = get().workspaces.find((w) => w.id === id);
    if (!ws) return;
    const role = ws.members?.[0]?.role ?? null;
    if (typeof window !== "undefined") {
      localStorage.setItem(WORKSPACE_ID_KEY, id);
    }
    set({ currentWorkspace: ws, currentWorkspaceId: id, currentUserRole: role });
  },

  createWorkspace: async (data: { name: string }) => {
    set({ error: null });
    const { workspace } = await apiCreateWorkspace({ name: data.name });
    const workspaces = [...get().workspaces, workspace];
    const role = "OWNER" as WorkspaceRole;
    if (typeof window !== "undefined") {
      localStorage.setItem(WORKSPACE_ID_KEY, workspace.id);
    }
    set({ workspaces, currentWorkspace: workspace, currentWorkspaceId: workspace.id, currentUserRole: role });
    return workspace;
  },

  updateWorkspace: async (id: string, data: { name?: string; logoUrl?: string; website?: string }) => {
    set({ error: null });
    const { workspace } = await apiUpdateWorkspace(id, data);
    const workspaces = get().workspaces.map((w) => (w.id === id ? { ...w, ...workspace } : w));
    const currentWorkspace = get().currentWorkspaceId === id ? { ...get().currentWorkspace, ...workspace } as Workspace : get().currentWorkspace;
    set({ workspaces, currentWorkspace });
    return workspace;
  },

  deleteWorkspace: async (id: string) => {
    set({ error: null });
    await apiDeleteWorkspace(id);
    const remaining = get().workspaces.filter((w) => w.id !== id);

    if (get().currentWorkspaceId === id) {
      if (remaining.length > 0) {
        const ws = remaining[0];
        const role = ws.members?.[0]?.role ?? null;
        if (typeof window !== "undefined") {
          localStorage.setItem(WORKSPACE_ID_KEY, ws.id);
        }
        set({ workspaces: remaining, currentWorkspace: ws, currentWorkspaceId: ws.id, currentUserRole: role });
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem(WORKSPACE_ID_KEY);
        }
        set({ workspaces: [], currentWorkspace: null, currentWorkspaceId: null, currentUserRole: null });
      }
    } else {
      set({ workspaces: remaining });
    }
  },
}));
