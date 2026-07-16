"use client";

import { QueryClient } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
  type Persister,
} from "@tanstack/react-query-persist-client";
import { useState } from "react";

// Devtools - use static import with ssr: false wrapper to avoid Turbopack chunk issues
const ReactQueryDevtools = process.env.NODE_ENV === "development"
  ? (() => {
      try {
        return require("@tanstack/react-query-devtools").ReactQueryDevtools;
      } catch {
        return () => null;
      }
    })()
  : () => null;

const CACHE_KEY = "rq:persist";

function createLocalStoragePersister(): Persister {
  return {
    persistClient: async (client) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(client));
      } catch {
        // storage full or unavailable
      }
    },
    restoreClient: async () => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? (JSON.parse(raw) as any) : undefined;
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {
        // ignore
      }
    },
  };
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: createLocalStoragePersister(),
        maxAge: 1000 * 60 * 30,
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => {
            const key = q.queryKey[0];
            return (
              typeof key === "string" &&
              !key.startsWith("admin") &&
              q.state.status === "success"
            );
          },
        },
      }}
    >
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
      )}
    </PersistQueryClientProvider>
  );
}
