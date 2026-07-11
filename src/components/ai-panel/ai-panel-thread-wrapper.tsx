"use client";

import { useEffect, useRef } from "react";
import { useThreadRuntime } from "@assistant-ui/react";
import { useAiPanel } from "./ai-panel-context";
import { Thread } from "@/components/thread";

const DEFAULT_SUGGESTIONS = [
  "Check low stock items",
  "Show sales this week",
  "Look up patient by name",
  "Check drug interactions",
  "What are my top selling products?",
];

/**
 * Renders the Thread with page-context-aware suggestions.
 * Must be rendered inside an AssistantRuntimeProvider.
 */
export function AiPanelThreadWrapper() {
  const { activePageContext, setMessages } = useAiPanel();
  const threadRuntime = useThreadRuntime();

  // Get suggestions from page context or use defaults
  const suggestions = activePageContext?.suggestedActions
    ?.map((a) => a.label)
    .slice(0, 5);

  // Sync thread messages to context for sharing with full page
  const messagesRef = useRef<string>("");

  useEffect(() => {
    const unsubscribe = threadRuntime.subscribe(() => {
      const msgs = threadRuntime.getState().messages;
      const serialized = JSON.stringify(
        msgs.map((m) => ({
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
        })),
      );
      if (serialized !== messagesRef.current) {
        messagesRef.current = serialized;
        setMessages(
          msgs.map((m) => ({
            role: m.role as "user" | "assistant",
            content:
              typeof m.content === "string"
                ? m.content
                : Array.isArray(m.content)
                  ? m.content
                      .filter((part: any) => part.type === "text")
                      .map((part: any) => part.text)
                      .join("")
                  : "",
          })),
        );
      }
    });
    return unsubscribe;
  }, [threadRuntime, setMessages]);

  return (
    <Thread
      suggestions={suggestions ?? DEFAULT_SUGGESTIONS}
      compact
    />
  );
}
