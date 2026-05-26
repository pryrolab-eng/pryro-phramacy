"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInvoiceTemplate,
  invoiceTemplateKeys,
  updateInvoiceTemplate,
  type InvoiceTemplate,
} from "@/lib/http/invoice-template";

export {
  invoiceTemplateKeys,
  type InvoiceTemplate,
} from "@/lib/http/invoice-template";

export function useInvoiceTemplate(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: invoiceTemplateKeys.all,
    queryFn: getInvoiceTemplate,
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateInvoiceTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InvoiceTemplate) => updateInvoiceTemplate(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: invoiceTemplateKeys.all }),
  });
}
