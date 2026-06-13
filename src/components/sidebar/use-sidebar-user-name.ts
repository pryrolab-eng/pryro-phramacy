"use client";

import { useEffect, useState } from "react";

export function useSidebarUserName(fallback: string) {
  const [userName, setUserName] = useState(fallback);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/me/context", { credentials: "include" });
        if (!res.ok) return;
        const ctx = (await res.json()) as {
          user?: { fullName?: string | null; email?: string | null };
        };
        const fullName = ctx.user?.fullName?.trim();
        if (fullName) {
          setUserName(fullName);
          return;
        }
        const email = ctx.user?.email?.split("@")[0];
        if (email) setUserName(email);
      } catch {
        /* keep fallback */
      }
    };
    void load();
  }, [fallback]);

  return userName;
}
