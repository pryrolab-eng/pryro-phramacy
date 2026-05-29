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
};

const DashboardScrollHeaderContext =
  createContext<DashboardScrollHeaderContextValue | null>(null);

/** Height of sticky shell bar — sentinel pins when scrolled past this offset. */
const SHELL_BAR_OFFSET_PX = 52;

export function DashboardScrollHeaderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isPinned, setIsPinned] = useState(false);
  const [config, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const registerSentinel = useCallback((element: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: `-${SHELL_BAR_OFFSET_PX}px 0px 0px 0px`,
        threshold: 0,
      },
    );
    observerRef.current.observe(element);
  }, []);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  const value = useMemo(
    () => ({
      isPinned,
      config,
      setHeaderConfig,
      registerSentinel,
    }),
    [isPinned, config, registerSentinel],
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
    }
  );
}
