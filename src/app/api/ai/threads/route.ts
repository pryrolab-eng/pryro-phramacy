import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") ?? "pharmacy";

    const threads = await prisma.ai_threads.findMany({
      where: {
        user_id: user.id,
        scope,
      },
      orderBy: { updated_at: "desc" },
      take: 50,
    });

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("GET /api/ai/threads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { scope, title } = body as { scope: string; title?: string };

    const thread = await prisma.ai_threads.create({
      data: {
        user_id: user.id,
        scope,
        title: title ?? "New conversation",
      },
    });

    return NextResponse.json({ thread });
  } catch (error) {
    console.error("POST /api/ai/threads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
