import { apiClient } from "./client";
import { getStoredTokens } from "@/lib/auth/api";

export interface Conversation {
  id: string;
  sessionId: string;
  chatbotId: string;
  chatbot: { name: string };
  isActive: boolean;
  resolvedAt?: string | null;
  startedAt: string;
  lastActivityAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ListConversationsResponse {
  data: Conversation[];
  pagination: Pagination;
}

interface UpdateStatusResponse {
  id: string;
  isActive: boolean;
  resolvedAt: string | null;
}

interface DeleteResponse {
  success: boolean;
}

function wsPath(workspaceId: string) {
  return `/workspaces/${workspaceId}/conversations`;
}

function chatbotConversationsPath(workspaceId: string, chatbotId: string) {
  return `/workspaces/${workspaceId}/chatbots/${chatbotId}/conversations`;
}

export async function listWorkspaceConversations(
  workspaceId: string,
  params?: { page?: number; limit?: number; status?: "active" | "resolved" },
): Promise<ListConversationsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  return apiClient<ListConversationsResponse>(
    `${wsPath(workspaceId)}${qs ? `?${qs}` : ""}`,
  );
}

export async function listChatbotConversations(
  workspaceId: string,
  chatbotId: string,
  params?: { page?: number; limit?: number; status?: "active" | "resolved" },
): Promise<ListConversationsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  return apiClient<ListConversationsResponse>(
    `${chatbotConversationsPath(workspaceId, chatbotId)}${qs ? `?${qs}` : ""}`,
  );
}

export async function getConversation(
  workspaceId: string,
  conversationId: string,
): Promise<Conversation> {
  return apiClient<Conversation>(
    `${wsPath(workspaceId)}/${conversationId}`,
  );
}

export async function getMessages(
  workspaceId: string,
  conversationId: string,
): Promise<Message[]> {
  return apiClient<Message[]>(
    `${wsPath(workspaceId)}/${conversationId}/messages`,
  );
}

export async function updateConversationStatus(
  workspaceId: string,
  conversationId: string,
  data: { isResolved?: boolean; isActive?: boolean },
): Promise<UpdateStatusResponse> {
  return apiClient<UpdateStatusResponse>(
    `${wsPath(workspaceId)}/${conversationId}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );
}

export async function deleteConversation(
  workspaceId: string,
  conversationId: string,
): Promise<DeleteResponse> {
  return apiClient<DeleteResponse>(
    `${wsPath(workspaceId)}/${conversationId}`,
    { method: "DELETE" },
  );
}

export async function exportConversation(
  workspaceId: string,
  conversationId: string,
): Promise<Blob> {
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const { accessToken } = getStoredTokens();

  const res = await fetch(
    `${BASE_URL}${wsPath(workspaceId)}/${conversationId}/export`,
    {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Export failed" }));
    if (res.status === 401) {
      const { clearTokens } = await import("@/lib/auth/api");
      clearTokens();
      throw new (await import("./client")).UnauthorizedError();
    }
    if (res.status === 403) {
      throw new (await import("./client")).ForbiddenError(body.error ?? "Forbidden");
    }
    throw new (await import("./client")).ApiError(body.error ?? "Export failed");
  }

  return res.blob();
}
