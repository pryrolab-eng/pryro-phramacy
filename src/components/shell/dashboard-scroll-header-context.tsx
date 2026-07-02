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
  const sentinelRef = useRef<HTMLElement | null>(null);
  const [observerKey, setObserverKey] = useState(0);

  const setScrollRoot = useCallback((element: HTMLElement | null) => {
    scrollRootRef.current = element;
    setObserverKey((key) => key + 1);
  }, []);

  const registerSentinel = useCallback((element: HTMLElement | null) => {
    sentinelRef.current = element;
    setObserverKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      setIsPinned(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(!entry.isIntersecting);
      },
      {
        root: scrollRootRef.current,
        rootMargin: "0px",
        threshold: 0,
      },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [observerKey]);

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
