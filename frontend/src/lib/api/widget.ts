import { apiClient } from "./client";

export interface ChatWidget {
  displayName?: string;
  initialMessages: string[];
  messagePlaceholder?: string;
  footerText?: string;
  theme: "LIGHT" | "DARK";
  profilePictureUrl?: string;
  chatIconUrl?: string;
  primaryColor: string;
  bubbleColor: string;
  bubbleAlignment: "BOTTOM_RIGHT" | "BOTTOM_LEFT";
  isActive: boolean;
}

const BASE = (ws: string, cb: string) =>
  `/workspaces/${ws}/chatbots/${cb}/widget`;

export async function getWidgetConfig(
  workspaceId: string,
  chatbotId: string,
): Promise<ChatWidget> {
  return apiClient<ChatWidget>(`${BASE(workspaceId, chatbotId)}`);
}

export async function updateWidgetConfig(
  workspaceId: string,
  chatbotId: string,
  data: Partial<ChatWidget>,
): Promise<ChatWidget> {
  return apiClient<ChatWidget>(`${BASE(workspaceId, chatbotId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function activateWidget(
  workspaceId: string,
  chatbotId: string,
  isActive: boolean,
): Promise<ChatWidget> {
  return apiClient<ChatWidget>(`${BASE(workspaceId, chatbotId)}/activate`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function getWidgetEmbedCode(
  workspaceId: string,
  chatbotId: string,
): Promise<{ embedCode: string }> {
  return apiClient<{ embedCode: string }>(
    `${BASE(workspaceId, chatbotId)}/embed-code`,
  );
}
