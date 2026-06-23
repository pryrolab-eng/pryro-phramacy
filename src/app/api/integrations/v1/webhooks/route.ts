import type { NextRequest } from "next/server";
import {
  GET_webhooksList,
  POST_webhooksCreate,
} from "@/lib/integrations/v1/handlers";

export async function GET(request: NextRequest) {
  return GET_webhooksList(request);
}

export async function POST(request: NextRequest) {
  return POST_webhooksCreate(request);
}
