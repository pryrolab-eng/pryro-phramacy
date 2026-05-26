"use client";

import { useMutation } from "@tanstack/react-query";
import {
  createPharmacist,
  type CreatePharmacistInput,
} from "@/lib/http/pharmacist";

export function useCreatePharmacistMutation() {
  return useMutation({
    mutationFn: (input: CreatePharmacistInput) => createPharmacist(input),
  });
}
