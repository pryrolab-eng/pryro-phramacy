import type { NextRequest } from "next/server";
import { GET_inventory } from "@/lib/integrations/v1/handlers";

export async function GET(request: NextRequest) {
  return GET_inventory(request);
}
