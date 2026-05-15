"use client";

import {
  adminSystemSettingsQueryKey,
  getAdminSystemSettings,
} from "@/lib/http/admin/system-settings";
import { useQuery } from "@tanstack/react-query";

export { adminSystemSettingsQueryKey } from "@/lib/http/admin/system-settings";

export function useAdminSystemSettings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminSystemSettingsQueryKey,
    queryFn: getAdminSystemSettings,
    enabled: options?.enabled ?? true,
  });
}
