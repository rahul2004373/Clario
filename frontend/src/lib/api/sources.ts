import { apiClient } from "./client";
import { getStoredTokens } from "@/lib/auth/api";

export type SourceType = "PDF" | "DOCX" | "TXT" | "CSV" | "XLSX" | "URL" | "PLAIN_TEXT";

export interface SourceMetadata {
  language?: string;
  title?: string;
  author?: string;
  tags?: string[];
  description?: string;
}

export interface Source {
  id: string;
  chatbotId: string;
  name: string;
  type: SourceType;
  fileUrl?: string;
  sourceUrl?: string;
  fileSize?: number;
  metadata?: SourceMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface IngestionJob {
  id: string;
  sourceId: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

const BASE = (ws: string, cb: string) => `/workspaces/${ws}/chatbots/${cb}/sources`;

export async function listSources(
  workspaceId: string,
  chatbotId: string,
): Promise<{ sources: Source[] }> {
  return apiClient<{ sources: Source[] }>(BASE(workspaceId, chatbotId));
}

export async function getSource(
  workspaceId: string,
  chatbotId: string,
  sourceId: string,
): Promise<{ source: Source }> {
  return apiClient<{ source: Source }>(
    `${BASE(workspaceId, chatbotId)}/${sourceId}`,
  );
}

export async function uploadSource(
  workspaceId: string,
  chatbotId: string,
  file: File,
  name?: string,
): Promise<{ message: string; source: Partial<Source> }> {
  const { accessToken } = getStoredTokens();
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);

  const res = await fetch(
    `${BASE_URL}${BASE(workspaceId, chatbotId)}/upload`,
    {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Upload failed" }));
    if (res.status === 401) {
      const { clearTokens } = await import("@/lib/auth/api");
      clearTokens();
      throw new (await import("./client")).UnauthorizedError();
    }
    if (res.status === 403) {
      throw new (await import("./client")).ForbiddenError(body.error ?? "Forbidden");
    }
    throw new (await import("./client")).ApiError(body.error ?? "Upload failed");
  }

  return res.json();
}

export async function createUrlSource(
  workspaceId: string,
  chatbotId: string,
  data: { name: string; sourceUrl: string },
): Promise<{ message: string; source: Partial<Source> }> {
  return apiClient<{ message: string; source: Partial<Source> }>(
    `${BASE(workspaceId, chatbotId)}/url`,
    { method: "POST", body: JSON.stringify(data) },
  );
}

export async function createTextSource(
  workspaceId: string,
  chatbotId: string,
  data: { name: string; content: string },
): Promise<{ message: string; source: Partial<Source> }> {
  return apiClient<{ message: string; source: Partial<Source> }>(
    `${BASE(workspaceId, chatbotId)}/text`,
    { method: "POST", body: JSON.stringify(data) },
  );
}

export async function updateSource(
  workspaceId: string,
  chatbotId: string,
  sourceId: string,
  data: Partial<Pick<Source, "name">> & { metadata?: SourceMetadata },
): Promise<{ message: string; source: Partial<Source> }> {
  return apiClient<{ message: string; source: Partial<Source> }>(
    `${BASE(workspaceId, chatbotId)}/${sourceId}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );
}

export async function deleteSource(
  workspaceId: string,
  chatbotId: string,
  sourceId: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    `${BASE(workspaceId, chatbotId)}/${sourceId}`,
    { method: "DELETE" },
  );
}

export async function reingestSource(
  workspaceId: string,
  chatbotId: string,
  sourceId: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    `${BASE(workspaceId, chatbotId)}/${sourceId}/reingest`,
    { method: "POST" },
  );
}

export async function listJobs(
  workspaceId: string,
  chatbotId: string,
): Promise<{ jobs: IngestionJob[] }> {
  return apiClient<{ jobs: IngestionJob[] }>(
    `${BASE(workspaceId, chatbotId)}/jobs`,
  );
}
