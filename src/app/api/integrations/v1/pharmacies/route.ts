import type { NextRequest } from "next/server";
import { GET_pharmaciesList } from "@/lib/integrations/v1/handlers";

export async function GET(request: NextRequest) {
  return GET_pharmaciesList(request);
}
