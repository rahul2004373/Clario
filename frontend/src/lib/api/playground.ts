import { apiClient } from "./client";
import { getStoredTokens } from "@/lib/auth/api";

export interface ChatMessage {
  id?: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  welcomeMessage?: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

const BASE = (ws: string, cb: string) =>
  `/workspaces/${ws}/chatbots/${cb}/playground`;

export async function createSession(
  workspaceId: string,
  chatbotId: string,
  formData?: Record<string, string>,
): Promise<CreateSessionResponse> {
  return apiClient<CreateSessionResponse>(
    `${BASE(workspaceId, chatbotId)}/session`,
    {
      method: "POST",
      body: JSON.stringify({ formData: formData ?? { name: "User", email: "user@example.com" } }),
    },
  );
}

export async function deleteSession(
  workspaceId: string,
  chatbotId: string,
  sessionId: string,
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(
    `${BASE(workspaceId, chatbotId)}/session`,
    {
      method: "DELETE",
      body: JSON.stringify({ sessionId }),
    },
  );
}

export function deleteSessionKeepalive(
  workspaceId: string,
  chatbotId: string,
  sessionId: string,
): void {
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const { accessToken } = getStoredTokens();

  fetch(`${BASE_URL}${BASE(workspaceId, chatbotId)}/session`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ sessionId }),
    keepalive: true,
  }).catch(() => {});
}

const STREAM_TIMEOUT = 60000;

export async function sendMessageStream(
  workspaceId: string,
  chatbotId: string,
  sessionId: string,
  message: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const { accessToken } = getStoredTokens();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT);

  try {
    const response = await fetch(
      `${BASE_URL}${BASE(workspaceId, chatbotId)}/message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ sessionId, message }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Message failed" }));
      callbacks.onError(body.error ?? "Message failed");
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError("No response stream available");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let doneEvent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6);
          if (!jsonStr || jsonStr === "{}") continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              callbacks.onError(data.error);
              return;
            }
            if (data.text) {
              callbacks.onChunk(data.text);
            }
          } catch {
            // skip malformed JSON
          }
        } else if (trimmed === "event: done" || trimmed === "event:done") {
          doneEvent = true;
        }
      }
    }

    // Check buffer for trailing data
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data: ")) {
        const jsonStr = trimmed.slice(6);
        if (jsonStr && jsonStr !== "{}") {
          try {
            const data = JSON.parse(jsonStr);
            if (data.text) {
              callbacks.onChunk(data.text);
            }
          } catch {
            // skip
          }
        }
      }
    }

    if (doneEvent) {
      callbacks.onDone();
    } else {
      // If no explicit done event, still consider it done when stream closes
      callbacks.onDone();
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      callbacks.onError("Request timed out");
    } else {
      callbacks.onError(
        err instanceof Error ? err.message : "Stream request failed",
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}
