"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";

const RESOLVE_LINES = [
  "Signing you in",
  "Loading your pharmacy data",
  "Preparing dashboard",
] as const;

export type AppEntryLoaderPhase = "resolving" | "redirecting" | "error";

type AppEntryLoaderProps = {
  phase?: AppEntryLoaderPhase;
  errorMessage?: string | null;
  onRetry?: () => void;
};

export function AppEntryLoader({
  phase = "resolving",
  errorMessage = null,
  onRetry,
}: AppEntryLoaderProps) {
  const [lineIndex, setLineIndex] = useState(0);

  const statusLine = useMemo(() => {
    if (phase === "redirecting") return "Taking you to your workspace";
    if (phase === "error") return errorMessage ?? "Something went wrong";
    return RESOLVE_LINES[lineIndex];
  }, [phase, errorMessage, lineIndex]);

  useEffect(() => {
    if (phase !== "resolving") return;
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % RESOLVE_LINES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [phase]);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6"
      role="status"
      aria-live="polite"
      aria-busy={phase !== "error"}
      aria-label={phase === "error" ? "Error loading workspace" : "Loading your workspace"}
    >
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {phase === "error" ? (
            <div className="size-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="size-6 text-red-600" />
            </div>
          ) : (
            <Spinner className="size-8 text-neutral-500" />
          )}
        </motion.div>

        <div
          className={
            phase === "error"
              ? "min-h-6 w-full"
              : "h-6 w-full overflow-hidden"
          }
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={statusLine}
              className={
                phase === "error"
                  ? "text-sm font-medium text-red-600"
                  : "text-sm font-medium text-neutral-500"
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              {statusLine}
              {phase !== "error" ? (
                <span
                  className="inline-block w-[1.25em] overflow-hidden text-left align-bottom animate-app-entry-dots"
                  aria-hidden
                >
                  …
                </span>
              ) : null}
            </motion.p>
          </AnimatePresence>
        </div>

        {phase === "error" && onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-[10px]"
            onClick={onRetry}
          >
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
