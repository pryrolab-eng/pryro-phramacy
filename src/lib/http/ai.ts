import { fetchJson } from "./client";

// ─── Query Keys ────────────────────────────────────────────────

export const aiKeys = {
  all: ["ai"] as const,
  threads: () => [...aiKeys.all, "threads"] as const,
  threadList: (scope: AiThreadScope) => [...aiKeys.threads(), scope] as const,
  thread: (id: string) => [...aiKeys.all, "thread", id] as const,
  messages: (threadId: string) => [...aiKeys.all, "messages", threadId] as const,
};

// ─── Types ─────────────────────────────────────────────────────

export type AiThreadScope = "pharmacy" | "platform_admin";

export type AiThread = {
  id: string;
  userId: string;
  pharmacyId: string | null;
  branchId: string | null;
  scope: AiThreadScope;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiMessage = {
  id: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls: unknown | null;
  a2uiData: unknown | null;
  tokens: number | null;
  createdAt: string;
};

export type AiChatRequest = {
  threadId?: string;
  messages: { role: string; content: string }[];
  scope: AiThreadScope;
};

export type AiChatResponse = {
  threadId: string;
  message: AiMessage;
};

export type AiThreadsResponse = {
  threads: AiThread[];
};

// ─── Fetchers ──────────────────────────────────────────────────

export async function getAiThreads(
  scope: AiThreadScope,
): Promise<AiThreadsResponse> {
  const params = new URLSearchParams({ scope });
  return fetchJson<AiThreadsResponse>(
    `/api/ai/threads?${params.toString()}`,
    { credentials: "include", cache: "no-store" },
  );
}

export async function getAiThreadMessages(
  threadId: string,
): Promise<{ messages: AiMessage[] }> {
  return fetchJson<{ messages: AiMessage[] }>(
    `/api/ai/threads/${threadId}/messages`,
    { credentials: "include", cache: "no-store" },
  );
}

export async function createAiThread(
  scope: AiThreadScope,
  title?: string,
): Promise<{ thread: AiThread }> {
  return fetchJson<{ thread: AiThread }>(`/api/ai/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ scope, title }),
  });
}

export async function deleteAiThread(threadId: string): Promise<void> {
  await fetchJson(`/api/ai/threads/${threadId}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export async function sendAiChatMessage(
  request: AiChatRequest,
): Promise<AiChatResponse> {
  return fetchJson<AiChatResponse>(`/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
}
