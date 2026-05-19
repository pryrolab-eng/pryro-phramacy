import { NextResponse } from "next/server";
import { isPolarConfigured } from "@/lib/polar/client";

export async function GET() {
  return NextResponse.json({
    enabled: isPolarConfigured(),
    server:
      process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });
}
