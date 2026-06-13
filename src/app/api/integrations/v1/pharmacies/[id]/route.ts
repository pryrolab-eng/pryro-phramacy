import type { NextRequest } from "next/server";
import { GET_pharmacyById } from "@/lib/integrations/v1/handlers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return GET_pharmacyById(request, id);
}
