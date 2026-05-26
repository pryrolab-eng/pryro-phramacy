"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const AUTH_ERROR_LABELS: Record<string, string> = {
  "no-pharmacy": "No pharmacy access found. Please contact support.",
  "setup-failed": "Account setup failed. Please try again.",
  "no-pharmacy-access":
    "You don't have access to any pharmacy. Please contact your administrator.",
};

function resolveErrorMessage(raw: string) {
  return AUTH_ERROR_LABELS[raw] ?? decodeURIComponent(raw);
}

/** Shows ?error= and ?success= from auth redirects as Sonner toasts, then cleans the URL. */
export function AuthSearchParamsToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    if (!error && !success) {
      shown.current = null;
      return;
    }

    const key = `${error ?? ""}|${success ?? ""}`;
    if (shown.current === key) return;
    shown.current = key;

    if (error) toast.error(resolveErrorMessage(error));
    if (success) toast.success(decodeURIComponent(success));

    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    params.delete("success");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
