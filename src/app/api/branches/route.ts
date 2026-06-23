import { NextResponse } from "next/server";

const DEPRECATED_BRANCHES_RESPONSE = {
  error: "deprecated_endpoint",
  message: "Use /api/saas/branches for branch listing and creation.",
};

export async function GET() {
  return NextResponse.json(DEPRECATED_BRANCHES_RESPONSE, { status: 410 });
}

export async function POST() {
  return NextResponse.json(DEPRECATED_BRANCHES_RESPONSE, { status: 410 });
}
