import { NextRequest, NextResponse } from "next/server";

const DEPRECATED_MESSAGE =
  "Platform integration API keys are managed by Pryrox administrators (Admin → Settings → Integrations). " +
  "They are for external developers integrating with Pryrox — not per-pharmacy tenant keys.";

export async function GET() {
  return NextResponse.json(
    { error: "deprecated", message: DEPRECATED_MESSAGE },
    { status: 410 },
  );
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: DEPRECATED_MESSAGE },
    { status: 410 },
  );
}

export async function PUT(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: DEPRECATED_MESSAGE },
    { status: 410 },
  );
}
