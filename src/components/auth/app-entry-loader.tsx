"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AuthBrandingLogo } from "@/components/auth-branding";
import { LogoIcon } from "@/components/logo";

const STATUS_LINES = [
  "Preparing your workspace",
  "Checking your role",
  "Almost there",
] as const;

export function AppEntryLoader() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading your workspace"
    >
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative mb-10 flex h-28 w-28 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-neutral-200"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-600 border-r-neutral-900"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-3 rounded-full bg-neutral-50"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <LogoIcon className="size-10 text-neutral-900" uniColor />
          </motion.div>
        </div>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          <AuthBrandingLogo />
        </motion.div>

        <div className="h-6 w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={STATUS_LINES[lineIndex]}
              className="text-sm font-medium text-neutral-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              {STATUS_LINES[lineIndex]}
              <span
                className="inline-block w-[1.25em] overflow-hidden text-left align-bottom animate-app-entry-dots"
                aria-hidden
              >
                …
              </span>
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-neutral-200">
          <motion.div
            className="h-full w-1/3 rounded-full bg-blue-600"
            animate={{ x: ["-120%", "280%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          Pharmacy management platform
        </p>
      </div>
    </div>
  );
}
