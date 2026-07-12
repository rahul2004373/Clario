const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface PublicWidgetConfig {
  isActive: boolean;
  displayName?: string;
  initialMessages?: string[];
  messagePlaceholder?: string;
  footerText?: string;
  theme?: "LIGHT" | "DARK";
  profilePictureUrl?: string;
  chatIconUrl?: string;
  primaryColor?: string;
  bubbleColor?: string;
  bubbleAlignment?: "BOTTOM_RIGHT" | "BOTTOM_LEFT";
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export async function fetchPublicWidgetConfig(
  embedPublicKey: string,
): Promise<PublicWidgetConfig> {
  const res = await fetch(
    `${BASE_URL}/public/widget-config/${embedPublicKey}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Widget config fetch failed" }));
    throw new Error(body.error ?? "Widget config fetch failed");
  }
  return res.json();
}

export async function createPublicSession(
  embedPublicKey: string,
): Promise<{ sessionId: string; welcomeMessage?: string }> {
  const res = await fetch(`${BASE_URL}/public/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": embedPublicKey,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Session creation failed" }));
    throw new Error(body.error ?? "Session creation failed");
  }
  return res.json();
}

export async function sendPublicMessageStream(
  embedPublicKey: string,
  sessionId: string,
  message: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/public/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": embedPublicKey,
    },
    body: JSON.stringify({ sessionId, message, channel: "widget" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Message failed" }));
    callbacks.onError(body.error ?? "Message failed");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

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
          if (data.text) {
            fullText += data.text;
            callbacks.onChunk(data.text);
          }
        } catch {}
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
            fullText += data.text;
            callbacks.onChunk(data.text);
          }
        } catch {}
      }
    }
  }

  callbacks.onDone(fullText);
}

export async function endPublicSession(
  embedPublicKey: string,
  sessionId: string,
): Promise<void> {
  await fetch(`${BASE_URL}/public/session/${sessionId}`, {
    method: "DELETE",
    headers: {
      "x-api-key": embedPublicKey,
    },
  });
}
