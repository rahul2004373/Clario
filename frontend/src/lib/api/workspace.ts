import { apiClient } from "./client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type BusinessType = "GENERAL";

export type WorkspaceRole = "OWNER" | "ADMIN" | "VIEWER";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  website?: string | null;
  businessType: BusinessType;
  createdAt: string;
  updatedAt: string;
  members?: { role: WorkspaceRole }[];
}

/* ------------------------------------------------------------------ */
/*  API functions                                                      */
/* ------------------------------------------------------------------ */

export async function getWorkspaces(): Promise<{ workspaces: Workspace[] }> {
  return apiClient<{ workspaces: Workspace[] }>("/workspaces");
}

export async function createWorkspace(data: {
  name: string;
  businessType?: BusinessType;
}): Promise<{ workspace: Workspace }> {
  return apiClient<{ workspace: Workspace }>("/workspaces", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getWorkspace(
  workspaceId: string,
): Promise<{ workspace: Workspace }> {
  return apiClient<{ workspace: Workspace }>(`/workspaces/${workspaceId}`);
}

export async function updateWorkspace(
  workspaceId: string,
  data: Partial<Pick<Workspace, "name" | "logoUrl" | "website" | "businessType">>,
): Promise<{ workspace: Workspace }> {
  return apiClient<{ workspace: Workspace }>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteWorkspace(
  workspaceId: string,
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/workspaces/${workspaceId}`, {
    method: "DELETE",
  });
}
