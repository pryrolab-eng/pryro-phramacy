import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "deprecated_endpoint",
      message:
        "Use /api/integrations/rra-ebm for VSDC-backed RRA EBM submissions.",
    },
    { status: 410 },
  );
}
