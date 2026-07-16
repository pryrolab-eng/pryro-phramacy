"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppEntryLoader } from "@/components/auth/app-entry-loader";
import { AppEntrySetPassword } from "@/components/auth/app-entry-set-password";
import { getMeContext, meContextKeys } from "@/lib/http/me-context";
import { pharmacyDashboardKeys, getCombinedDashboardData } from "@/lib/http/pharmacy-dashboard";
import { defaultReportRange } from "@/lib/pharmacy/branch-scope";
import { saasKeys } from "@/lib/http/saas";
import { getSaasBranches } from "@/lib/http/saas-branches";
import { entitlementsKeys, getPharmacyEntitlementsSnapshot } from "@/lib/http/entitlements";

/** Avoid a sub-second flash before redirect. */
const MIN_DISPLAY_MS = 750;
/** Abort and offer retry if routing takes too long. */
const MAX_WAIT_MS = 20_000;

type Phase = "resolving" | "set-password" | "redirecting" | "error";

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

/** Fire prefetches in batches so we don't exhaust the 10-connection Prisma pool. */
async function batchPrefetch(
  fns: (() => Promise<unknown>)[],
  batchSize: number,
): Promise<void> {
  for (let i = 0; i < fns.length; i += batchSize) {
    const batch = fns.slice(i, i + batchSize);
    await Promise.allSettled(batch.map((fn) => fn()));
  }
}

export function AppEntryGate() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("resolving");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runId = useRef(0);
  const navigatedRef = useRef(false);

  const redirectTo = useCallback(
    async (path: string, started: number) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;

      // Batch 1: sidebar-critical data only — 3 concurrent, 3s cap
      // Dashboard data loads on its own via React Query when the page mounts
      await Promise.race([
        batchPrefetch(
          [
            // Prefetch me context for sidebar/header
            () =>
              queryClient.prefetchQuery({
                queryKey: meContextKeys.all,
                queryFn: getMeContext,
                staleTime: 15_000,
              }),
            // Prefetch branches for branch switcher dropdown
            () =>
              queryClient.prefetchQuery({
                queryKey: saasKeys.branches(),
                queryFn: async () => {
                  const data = await getSaasBranches();
                  return data.branches;
                },
                staleTime: 30_000,
              }),
            // Prefetch entitlements for feature gating
            () =>
              queryClient.prefetchQuery({
                queryKey: entitlementsKeys.pharmacy(),
                queryFn: getPharmacyEntitlementsSnapshot,
                staleTime: 30_000,
              }),
          ],
          3,
        ),
        wait(3000),
      ]);

      // Fire-and-forget: preheat dashboard in the background
      // If it completes before the page mounts, dashboard renders instantly
      if (path.startsWith("/pharmacy/")) {
        const range = defaultReportRange(30);
        queryClient.prefetchQuery({
          queryKey: [...pharmacyDashboardKeys.all, "combined", "all"],
          queryFn: () => getCombinedDashboardData({ ...range }),
          staleTime: 10 * 60 * 1000,
        });
      }

      // Minimum display time so the user doesn't see a flash
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      await wait(remaining);

      setPhase("redirecting");
      router.prefetch(path);
      router.replace(path);
    },
    [queryClient, router],
  );

  const resolveAndRedirect = useCallback(async () => {
    const id = ++runId.current;
    setPhase("resolving");
    setErrorMessage(null);
    const started = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        MAX_WAIT_MS,
      );

      const res = await fetch("/api/auth/home", {
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      if (runId.current !== id) return;

      if (res.status === 401) {
        router.replace("/sign-in");
        return;
      }

      const body = (await res.json()) as {
        ok?: boolean;
        path?: string;
        mustChangePassword?: boolean;
        reason?: string;
      };

      if (!res.ok || !body.ok || !body.path) {
        throw new Error("Could not determine where to send you.");
      }

      if (body.mustChangePassword) {
        setPhase("set-password");
        return;
      }

      if (runId.current !== id) return;
      await redirectTo(body.path, started);
    } catch (err) {
      if (runId.current !== id) return;
      const aborted = err instanceof Error && err.name === "AbortError";
      setPhase("error");
      setErrorMessage(
        aborted
          ? "This is taking longer than expected. Check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Something went wrong.",
      );
    }
  }, [redirectTo, router]);

  const handlePasswordSet = useCallback(() => {
    navigatedRef.current = false;
    void queryClient.invalidateQueries({ queryKey: meContextKeys.all });
    setPhase("redirecting");
    void resolveAndRedirect();
  }, [queryClient, resolveAndRedirect]);

  useEffect(() => {
    void resolveAndRedirect();
    return () => {
      runId.current += 1;
    };
  }, [resolveAndRedirect]);

  if (phase === "set-password") {
    return <AppEntrySetPassword onComplete={handlePasswordSet} />;
  }

  return (
    <AppEntryLoader
      phase={phase}
      errorMessage={errorMessage}
      onRetry={
        phase === "error" ? () => void resolveAndRedirect() : undefined
      }
    />
  );
}
