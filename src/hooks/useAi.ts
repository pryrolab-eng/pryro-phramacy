import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  aiKeys,
  getAiThreads,
  getAiThreadMessages,
  createAiThread,
  deleteAiThread,
  sendAiChatMessage,
  type AiThreadScope,
  type AiChatRequest,
  type AiMessage,
} from "@/lib/http/ai";

// ─── Thread Queries ────────────────────────────────────────────

export function useAiThreads(scope: AiThreadScope) {
  return useQuery({
    queryKey: aiKeys.threadList(scope),
    queryFn: () => getAiThreads(scope),
  });
}

export function useAiThreadMessages(threadId: string | null) {
  return useQuery({
    queryKey: aiKeys.messages(threadId ?? ""),
    queryFn: () => getAiThreadMessages(threadId!),
    enabled: Boolean(threadId),
  });
}

// ─── Thread Mutations ──────────────────────────────────────────

export function useCreateAiThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scope, title }: { scope: AiThreadScope; title?: string }) =>
      createAiThread(scope, title),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiKeys.threadList(variables.scope),
      });
    },
  });
}

export function useDeleteAiThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: string) => deleteAiThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.threads() });
    },
  });
}

// ─── Chat Mutation ─────────────────────────────────────────────

export function useSendAiChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AiChatRequest) => sendAiChatMessage(request),
    onSuccess: (data: { threadId: string; message: AiMessage }) => {
      queryClient.invalidateQueries({
        queryKey: aiKeys.messages(data.threadId),
      });
      queryClient.invalidateQueries({ queryKey: aiKeys.threads() });
    },
  });
}
