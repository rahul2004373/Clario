import { apiClient } from "./client";

export interface Analytics {
  totalConversations: number;
  totalMessages: number;
  avgConversationLength: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  trafficSource: { widget: number; dashboard: number; api: number };
  topQuestions: [];
  topicTrends: [];
}

export interface Chatbot {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  businessType?: "GENERAL";
  agentRole?: string;
  agentTone?: string;
  systemPrompt: string;
  welcomeMessage?: string;
  fallbackMessage?: string;
  isPublished: boolean;
  promptVersion: number;
  createdAt: string;
  updatedAt: string;
}

type EditableFields = Partial<
  Pick<
    Chatbot,
    | "name"
    | "description"
    | "systemPrompt"
    | "welcomeMessage"
    | "fallbackMessage"
    | "businessType"
    | "agentRole"
    | "agentTone"
  >
>;

export async function getChatbots(
  workspaceId: string,
): Promise<{ chatbots: Chatbot[] }> {
  return apiClient<{ chatbots: Chatbot[] }>(
    `/workspaces/${workspaceId}/chatbots`,
  );
}

export async function createChatbot(
  workspaceId: string,
  data: { name: string; systemPrompt: string } & Partial<{
    description: string;
    businessType: string;
    agentRole: string;
    agentTone: string;
    welcomeMessage: string;
    fallbackMessage: string;
  }>,
): Promise<{ message: string; chatbot: Pick<Chatbot, "id" | "name"> }> {
  return apiClient<{ message: string; chatbot: Pick<Chatbot, "id" | "name"> }>(
    `/workspaces/${workspaceId}/chatbots`,
    { method: "POST", body: JSON.stringify(data) },
  );
}

export async function getChatbot(
  workspaceId: string,
  chatbotId: string,
): Promise<{ chatbot: Chatbot }> {
  return apiClient<{ chatbot: Chatbot }>(
    `/workspaces/${workspaceId}/chatbots/${chatbotId}`,
  );
}

export async function updateChatbot(
  workspaceId: string,
  chatbotId: string,
  data: EditableFields,
): Promise<{ message: string; chatbot: Partial<Chatbot> }> {
  return apiClient<{ message: string; chatbot: Partial<Chatbot> }>(
    `/workspaces/${workspaceId}/chatbots/${chatbotId}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );
}

export async function deleteChatbot(
  workspaceId: string,
  chatbotId: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    `/workspaces/${workspaceId}/chatbots/${chatbotId}`,
    { method: "DELETE" },
  );
}

export async function publishChatbot(
  workspaceId: string,
  chatbotId: string,
  isPublished: boolean,
): Promise<{ message: string; chatbot: Partial<Chatbot> }> {
  return apiClient<{ message: string; chatbot: Partial<Chatbot> }>(
    `/workspaces/${workspaceId}/chatbots/${chatbotId}/publish`,
    { method: "PATCH", body: JSON.stringify({ isPublished }) },
  );
}

export async function getLastTrained(
  workspaceId: string,
  chatbotId: string,
): Promise<{ lastTrainedAt: string | null }> {
  return apiClient<{ lastTrainedAt: string | null }>(
    `/workspaces/${workspaceId}/chatbots/${chatbotId}/last-trained`,
  );
}

export async function getEmbedCode(
  workspaceId: string,
  chatbotId: string,
): Promise<{ embedCode: string }> {
  return apiClient<{ embedCode: string }>(
    `/workspaces/${workspaceId}/chatbots/${chatbotId}/embed-code`,
  );
}

export async function getAnalytics(
  workspaceId: string,
  chatbotId: string,
): Promise<Analytics> {
  return apiClient<Analytics>(
    `/workspaces/${workspaceId}/chatbots/${chatbotId}/analytics`,
  );
}


