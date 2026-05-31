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

type HeaderConfig = {
  title: string;
};

type DashboardScrollHeaderContextValue = {
  isPinned: boolean;
  config: HeaderConfig | null;
  setHeaderConfig: (config: HeaderConfig | null) => void;
  registerSentinel: (element: HTMLElement | null) => void;
  setScrollRoot: (element: HTMLElement | null) => void;
};

const DashboardScrollHeaderContext =
  createContext<DashboardScrollHeaderContextValue | null>(null);

export function DashboardScrollHeaderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isPinned, setIsPinned] = useState(false);
  const [config, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLElement | null>(null);

  const connectObserver = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(!entry.isIntersecting);
      },
      {
        root: scrollRootRef.current,
        rootMargin: "0px",
        threshold: 0,
      },
    );
    observerRef.current.observe(sentinel);
  }, []);

  const setScrollRoot = useCallback(
    (element: HTMLElement | null) => {
      scrollRootRef.current = element;
      connectObserver();
    },
    [connectObserver],
  );

  const registerSentinel = useCallback(
    (element: HTMLElement | null) => {
      sentinelRef.current = element;
      connectObserver();
    },
    [connectObserver],
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  const value = useMemo(
    () => ({
      isPinned,
      config,
      setHeaderConfig,
      registerSentinel,
      setScrollRoot,
    }),
    [isPinned, config, registerSentinel, setScrollRoot],
  );

  return (
    <DashboardScrollHeaderContext.Provider value={value}>
      {children}
    </DashboardScrollHeaderContext.Provider>
  );
}

export function useDashboardScrollHeader() {
  const ctx = useContext(DashboardScrollHeaderContext);
  return (
    ctx ?? {
      isPinned: false,
      config: null,
      setHeaderConfig: () => {},
      registerSentinel: () => {},
      setScrollRoot: () => {},
    }
  );
}
