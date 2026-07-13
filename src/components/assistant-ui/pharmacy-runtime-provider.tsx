"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { useMemo, type ReactNode } from "react";
import { useAiPanel } from "@/components/ai-panel/ai-panel-context";

type AiPageContext = {
  version: 1;
  capturedAt: number;
  route: string;
  page: string;
  entity: string;
  filters?: Record<string, unknown>;
  selected?: { id: string; label: string };
  summary?: Record<string, number>;
  capabilities?: string[];
  suggestedActions?: { label: string; toolHint: string }[];
};

type AiRuntimeProviderProps = {
  children: ReactNode;
  scope: "pharmacy" | "platform_admin";
  threadId?: string;
  onThreadCreated?: (threadId: string) => void;
  pageContext?: AiPageContext;
  messages?: { role: "user" | "assistant"; content: string }[];
};

function useAiChatAdapter(
  scope: "pharmacy" | "platform_admin",
  threadId: string | undefined,
  onThreadCreated: ((threadId: string) => void) | undefined,
  pageContext: AiPageContext | undefined,
  setUpgradeDialogOpen: (open: boolean) => void,
): ChatModelAdapter {
  return useMemo(
    () => ({
      async *run({ messages, abortSignal }) {
        const apiMessages = messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role,
            content:
              typeof m.content === "string"
                ? m.content
                : Array.isArray(m.content)
                  ? m.content
                      .filter((part: any) => part.type === "text")
                      .map((part: any) => part.text)
                      .join("")
                  : "",
          }));

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: abortSignal,
          body: JSON.stringify({
            threadId,
            messages: apiMessages,
            scope,
            pageContext,
          }),
        });

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ error: "Request failed" }));
          const errorMsg = error.error ?? `HTTP ${response.status}`;
          
          // Detect upgrade required errors and show dialog instead
          if (errorMsg.includes("requires a plan that includes this feature") || errorMsg.includes("requires a paid plan")) {
            setUpgradeDialogOpen(true);
            yield {
              content: [{ type: "text", text: "This feature requires a subscription upgrade." }],
              status: { type: "complete", reason: "stop" },
            };
            return;
          }
          
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        const toolCalls: any[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "text") {
                fullContent += event.delta;
                yield {
                  content: [{ type: "text", text: fullContent }],
                };
              } else if (event.type === "tool_calls") {
                toolCalls.push(
                  ...event.calls.map((tc: any) => ({
                    type: "tool-call" as const,
                    toolName: tc.name,
                    toolCallId: tc.id,
                    args: {},
                  })),
                );
                yield {
                  content: [
                    ...toolCalls.map((tc) => ({
                      ...tc,
                      args: tc.args,
                    })),
                  ],
                };
              } else if (event.type === "done") {
                if (event.threadId && onThreadCreated) {
                  onThreadCreated(event.threadId);
                }

                // Final yield with complete content
                const contentParts: any[] = [];

                if (event.toolCalls && Array.isArray(event.toolCalls)) {
                  event.toolCalls.forEach((tc: any) => {
                    contentParts.push({
                      type: "tool-call",
                      toolName: tc.name,
                      toolCallId: tc.id,
                      args: tc.args ?? {},
                      result: tc.result,
                    });
                  });
                }

                if (event.content) {
                  contentParts.push({ type: "text", text: event.content });
                }

                yield {
                  content:
                    contentParts.length > 0
                      ? contentParts
                      : [{ type: "text", text: "Done." }],
                  status: { type: "complete", reason: "stop" },
                };
              } else if (event.type === "error") {
                throw new Error(event.error);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      },
    }),
    [scope, threadId, onThreadCreated, pageContext, setUpgradeDialogOpen],
  );
}

export function AiRuntimeProvider({
  children,
  scope,
  threadId,
  onThreadCreated,
  pageContext,
  messages,
}: AiRuntimeProviderProps) {
  const { setUpgradeDialogOpen } = useAiPanel();
  const adapter = useAiChatAdapter(
    scope,
    threadId,
    onThreadCreated,
    pageContext,
    setUpgradeDialogOpen,
  );
  const runtime = useLocalRuntime(adapter, {
    initialMessages: messages && messages.length > 0 ? messages : undefined,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
