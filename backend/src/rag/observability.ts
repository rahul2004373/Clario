import { Client } from "langsmith";
import { traceable } from "langsmith/traceable";
import { env } from "../config/env";

let langSmithClient: Client | null = null;

export function getLangSmithClient() {
  if (!env.LANGSMITH_TRACING || !env.LANGSMITH_API_KEY) {
    return null;
  }

  if (!langSmithClient) {
    langSmithClient = new Client();
  }

  return langSmithClient;
}

export function traceRagFunction<T extends (...args: any[]) => any>(
  name: string,
  runType: "chain" | "tool" | "llm",
  fn: T
): T {
  const client = getLangSmithClient();

  if (!client) {
    return fn;
  }

  return traceable(fn, {
    name,
    run_type: runType,
    client
  }) as T;
}

export async function flushLangSmithTraces() {
  const client = getLangSmithClient();

  if (client) {
    await client.flush();
  }
}
