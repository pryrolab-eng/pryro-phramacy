"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  hasSensitiveAuthQueryParams,
  stripSensitiveAuthQueryParams,
} from "@/lib/auth/sensitive-query-params";

/** Removes credentials/tokens from the address bar on auth pages. */
export function AuthSensitiveParamsGuard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const stripped = useRef(false);

  useEffect(() => {
    if (stripped.current) return;
    if (!hasSensitiveAuthQueryParams(searchParams)) return;

    stripped.current = true;
    const { sanitized } = stripSensitiveAuthQueryParams(searchParams);
    const query = sanitized.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
