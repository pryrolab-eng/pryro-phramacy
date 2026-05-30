"use client";

import {
  adminSystemSettingsQueryKey,
  getAdminSystemSettings,
} from "@/lib/http/admin/system-settings";
import { useQuery } from "@tanstack/react-query";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export { adminSystemSettingsQueryKey } from "@/lib/http/admin/system-settings";

export function useAdminSystemSettings(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: adminSystemSettingsQueryKey,
    queryFn: getAdminSystemSettings,
    enabled: options?.enabled ?? true,
  });
}
