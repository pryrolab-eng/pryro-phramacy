"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPrescription,
  getPrescriptions,
  prescriptionsKeys,
  updatePrescription,
  type CreatePrescriptionInput,
  type PrescriptionRow,
} from "@/lib/http/prescriptions";

export {
  prescriptionsKeys,
  type CreatePrescriptionInput,
  type PrescriptionRow,
} from "@/lib/http/prescriptions";

export function usePrescriptions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: prescriptionsKeys.list(),
    queryFn: getPrescriptions,
    enabled: options?.enabled ?? true,
  });
}

export function useCreatePrescriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPrescription,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: prescriptionsKeys.list() }),
  });
}

export function useUpdatePrescriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<CreatePrescriptionInput> & { status?: string };
    }) => updatePrescription(id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: prescriptionsKeys.list() }),
  });
}
