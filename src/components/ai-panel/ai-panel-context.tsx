"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  capAiPageContext,
  type PageContext,
} from "@/lib/ai/page-context";

type PageContextGetter = () => PageContext | null | undefined;

type AiPanelContextValue = {
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;

  threadId: string | undefined;
  setThreadId: (id: string | undefined) => void;

  maximizedThreadId: string | undefined;
  setMaximizedThreadId: (id: string | undefined) => void;

  isExpanding: boolean;
  setIsExpanding: (v: boolean) => void;

  scope: "pharmacy" | "platform_admin";
  setScope: (scope: "pharmacy" | "platform_admin") => void;

  activePageContext: PageContext | null;
  registerPageContext: (id: string, getContext: PageContextGetter) => () => void;
  refreshPageContext: () => PageContext | null;

  messages: { role: "user" | "assistant"; content: string }[];
  setMessages: (msgs: { role: "user" | "assistant"; content: string }[]) => void;

  upgradeDialogOpen: boolean;
  setUpgradeDialogOpen: (open: boolean) => void;
};

const AiPanelContext = createContext<AiPanelContextValue | null>(null);

export function AiPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [maximizedThreadId, setMaximizedThreadId] = useState<
    string | undefined
  >();
  const [isExpanding, setIsExpanding] = useState(false);
  const [scope, setScope] = useState<"pharmacy" | "platform_admin">(
    "pharmacy",
  );
  const [activePageContext, setActivePageContext] =
    useState<PageContext | null>(null);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const pageContextGetters = useRef(new Map<string, PageContextGetter>());

  const refreshPageContext = useCallback(() => {
    const getters = Array.from(pageContextGetters.current.values());
    const latestGetter = getters[getters.length - 1];
    const next = latestGetter?.();
    const capped = next ? capAiPageContext(next) : null;
    setActivePageContext(capped);
    return capped;
  }, []);

  const registerPageContext = useCallback(
    (id: string, getContext: PageContextGetter) => {
      pageContextGetters.current.set(id, getContext);
      return () => {
        pageContextGetters.current.delete(id);
        const getters = Array.from(pageContextGetters.current.values());
        const latestGetter = getters[getters.length - 1];
        const next = latestGetter?.();
        setActivePageContext(next ? capAiPageContext(next) : null);
      };
    },
    [],
  );

  const openPanel = useCallback(() => {
    refreshPageContext();
    setIsOpen(true);
  }, [refreshPageContext]);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => {
    setIsOpen((v) => {
      if (!v) refreshPageContext();
      return !v;
    });
  }, [refreshPageContext]);

  const value: AiPanelContextValue = useMemo(() => ({
    isOpen,
    openPanel,
    closePanel,
    togglePanel,
    threadId,
    setThreadId,
    maximizedThreadId,
    setMaximizedThreadId,
    isExpanding,
    setIsExpanding,
    scope,
    setScope,
    activePageContext,
    registerPageContext,
    refreshPageContext,
    messages,
    setMessages,
    upgradeDialogOpen,
    setUpgradeDialogOpen,
  }), [
    isOpen, openPanel, closePanel, togglePanel,
    threadId, setThreadId,
    maximizedThreadId, setMaximizedThreadId,
    isExpanding, setIsExpanding,
    scope, setScope,
    activePageContext, registerPageContext, refreshPageContext,
    messages, setMessages,
    upgradeDialogOpen, setUpgradeDialogOpen,
  ]);

  return (
    <AiPanelContext.Provider value={value}>{children}</AiPanelContext.Provider>
  );
}

export function useAiPanel() {
  const ctx = useContext(AiPanelContext);
  if (!ctx) throw new Error("useAiPanel must be used within AiPanelProvider");
  return ctx;
}

export function usePageContext(
  id: string,
  getContext: PageContextGetter,
) {
  const { registerPageContext } = useAiPanel();

  useEffect(() => {
    return registerPageContext(id, getContext);
  }, [id, getContext, registerPageContext]);
}

export function useAiPageContext(
  id: string,
  context: PageContext | (() => PageContext | null | undefined),
) {
  const contextRef = useRef(context);
  contextRef.current = context;

  const getter = useCallback(() => {
    const ctx = contextRef.current;
    if (typeof ctx === "function") return ctx();
    return ctx;
  }, []);

  usePageContext(id, getter);
}
