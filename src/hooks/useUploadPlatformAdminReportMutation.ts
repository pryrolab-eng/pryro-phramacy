"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  adminReportsSummaryQueryKey,
  uploadPlatformAdminReport,
} from "@/lib/http/admin/reports";

export function useUploadPlatformAdminReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadPlatformAdminReport,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminReportsSummaryQueryKey });
    },
  });
}
