"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword, type ChangePasswordInput } from "@/lib/http/change-password";
import { meContextKeys } from "@/lib/http/me-context";

export function useChangePasswordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meContextKeys.all });
    },
  });
}
