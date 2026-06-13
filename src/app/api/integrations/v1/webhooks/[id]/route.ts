import type { NextRequest } from "next/server";
import { DELETE_webhookById } from "@/lib/integrations/v1/handlers";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return DELETE_webhookById(request, id);
}
