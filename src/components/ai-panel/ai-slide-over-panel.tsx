"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAiPanel } from "./ai-panel-context";
import { AiPanelThreadWrapper } from "./ai-panel-thread-wrapper";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/components/hooks/use-mobile";
import { AiRuntimeProvider } from "@/components/assistant-ui/pharmacy-runtime-provider";
import { UpgradePlanDialog } from "@/components/subscription/upgrade-plan-dialog";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import { cn } from "@/lib/utils";

const AI_PAGE_PATHS = ["/pharmacy/ai", "/admin/ai"];

export function AiSlideOverPanel() {
  const {
    isOpen,
    closePanel,
    threadId,
    setThreadId,
    scope,
    setScope,
    setMaximizedThreadId,
    activePageContext,
    isExpanding,
    setIsExpanding,
    upgradeDialogOpen,
    setUpgradeDialogOpen,
  } = useAiPanel();
  const { setOpen, state: sidebarState } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const sidebarStateBeforeOpen = useRef<"expanded" | "collapsed">("expanded");
  const { can } = usePharmacyEntitlements();

  const isOnAiPage = AI_PAGE_PATHS.includes(pathname);
  const isAdminRoute = pathname.startsWith("/admin");

  // Sync scope with current route
  useEffect(() => {
    setScope(isAdminRoute ? "platform_admin" : "pharmacy");
  }, [isAdminRoute, setScope]);

  // Close panel when navigating to AI page (unless expanding)
  useEffect(() => {
    if (isOnAiPage && !isExpanding) closePanel();
  }, [isOnAiPage, isExpanding, closePanel]);

  // Sidebar collapse/expand
  const hasSavedSidebarState = useRef(false);
  useEffect(() => {
    if (isOpen && !hasSavedSidebarState.current) {
      sidebarStateBeforeOpen.current = sidebarState;
      hasSavedSidebarState.current = true;
      setOpen(false);
    } else if (!isOpen && hasSavedSidebarState.current) {
      hasSavedSidebarState.current = false;
      setOpen(sidebarStateBeforeOpen.current === "expanded");
    }
  }, [isOpen, setOpen, sidebarState]);

  const handleMaximize = () => {
    // Admin gets global AI access via role — no plan check needed
    if (scope !== "platform_admin" && !can("ai.chat")) {
      setUpgradeDialogOpen(true);
      return;
    }
    setMaximizedThreadId(threadId);
    setIsExpanding(true);
    const route = scope === "platform_admin" ? "/admin/ai" : "/pharmacy/ai";
    router.push(route);
  };

  const handleThreadCreated = (newThreadId: string) => {
    setThreadId(newThreadId);
  };

  // Hide when on AI page and not expanding
  if (isOnAiPage && !isExpanding) return null;

  return (
    <>
    <motion.div
      layout
      className={cn(
        "flex flex-col border-l bg-white dark:bg-neutral-950 dark:border-neutral-800",
        isExpanding
          ? "flex-1 min-w-0 border-l-0"
          : isOpen
            ? "w-[400px] min-w-[400px]"
            : "w-0 min-w-0 overflow-hidden border-l-0",
      )}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex h-12 items-center justify-between border-b px-4 dark:border-neutral-800">
        <span className="text-sm font-semibold">Ask AI</span>
        <div className="flex items-center gap-1">
          {!isMobile && !isExpanding && (
            <button
              onClick={handleMaximize}
              className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Maximize"
            >
              <Maximize2 className="size-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (isExpanding) {
                setIsExpanding(false);
              }
              closePanel();
            }}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AiRuntimeProvider
          scope={scope}
          threadId={threadId}
          onThreadCreated={handleThreadCreated}
          pageContext={activePageContext ?? undefined}
        >
          <motion.div layoutId="ai-thread" className="h-full">
            <AiPanelThreadWrapper />
          </motion.div>
        </AiRuntimeProvider>
      </div>
    </motion.div>

    <UpgradePlanDialog
      open={upgradeDialogOpen}
      onOpenChange={setUpgradeDialogOpen}
      featureLabel="AI Chat"
    />
    </>
  );
}
