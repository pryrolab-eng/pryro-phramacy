"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { AiRuntimeProvider } from "@/components/assistant-ui/pharmacy-runtime-provider";
import { Thread } from "@/components/thread";
import { useAiPanel } from "@/components/ai-panel";

export default function AdminAiPage() {
  const {
    threadId: contextThreadId,
    maximizedThreadId,
    setMaximizedThreadId,
    setThreadId: setContextThreadId,
    setScope,
    activePageContext,
    isExpanding,
    setIsExpanding,
    messages,
  } = useAiPanel();

  const [threadId, setThreadId] = useState<string | undefined>(
    maximizedThreadId ?? contextThreadId,
  );

  useEffect(() => {
    setScope("platform_admin");
  }, [setScope]);

  useEffect(() => {
    if (maximizedThreadId) {
      setThreadId(maximizedThreadId);
      setMaximizedThreadId(undefined);
    }
  }, [maximizedThreadId, setMaximizedThreadId]);

  // Clear expanding state after mount
  useEffect(() => {
    if (isExpanding) {
      const timer = setTimeout(() => setIsExpanding(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isExpanding, setIsExpanding]);

  const handleThreadCreated = useCallback(
    (newThreadId: string) => {
      setThreadId(newThreadId);
      setContextThreadId(newThreadId);
    },
    [setContextThreadId],
  );

  return (
    <motion.div
      layoutId="ai-thread"
      className="flex h-full flex-col"
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <AiRuntimeProvider
        scope="platform_admin"
        threadId={threadId}
        onThreadCreated={handleThreadCreated}
        pageContext={activePageContext ?? undefined}
        messages={messages}
      >
        <Thread />
      </AiRuntimeProvider>
    </motion.div>
  );
}
