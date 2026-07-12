import { apiClient } from "./client";

export type MemberRole = "OWNER" | "ADMIN" | "VIEWER";

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: MemberRole;
  user: MemberUser;
  createdAt?: string;
}

export async function getMembers(
  workspaceId: string,
): Promise<{ members: WorkspaceMember[] }> {
  return apiClient<{ members: WorkspaceMember[] }>(
    `/workspaces/${workspaceId}/members`,
  );
}

export async function inviteMember(
  workspaceId: string,
  data: { email: string; role: "ADMIN" | "VIEWER" },
): Promise<{ member: WorkspaceMember }> {
  return apiClient<{ member: WorkspaceMember }>(
    `/workspaces/${workspaceId}/members/invite`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function changeMemberRole(
  workspaceId: string,
  memberId: string,
  role: "ADMIN" | "VIEWER",
): Promise<{ member: WorkspaceMember }> {
  return apiClient<{ member: WorkspaceMember }>(
    `/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export async function removeMember(
  workspaceId: string,
  memberId: string,
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(
    `/workspaces/${workspaceId}/members/${memberId}`,
    { method: "DELETE" },
  );
}
