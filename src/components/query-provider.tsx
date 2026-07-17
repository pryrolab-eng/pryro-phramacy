"use client";

import { QueryClient } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
  type Persister,
} from "@tanstack/react-query-persist-client";
import { useMemo } from "react";

// Static import so the devtools share the same @tanstack/react-query
// module instance (require() created a duplicate context -> "No QueryClient set").
import { ReactQueryDevtools as ReactQueryDevtoolsBase } from "@tanstack/react-query-devtools";

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
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [],
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
        <ReactQueryDevtoolsBase
          buttonPosition="bottom-left"
          initialIsOpen={false}
        />
      )}
    </PersistQueryClientProvider>
  );
}
