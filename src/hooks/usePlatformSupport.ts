"use client";

import { useCallback, useMemo } from "react";
import { useBranding } from "@/hooks/useBranding";
import { buildSupportMailto } from "@/lib/platform/support-email";

/** Platform support contact from admin settings (via public branding API). */
export function usePlatformSupport() {
  const { supportEmail } = useBranding();

  const supportMailto = useCallback(
    (subject: string) => buildSupportMailto(supportEmail, subject),
    [supportEmail],
  );

  return useMemo(
    () => ({
      supportEmail,
      supportMailto,
    }),
    [supportEmail, supportMailto],
  );
}
