import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const thread = await prisma.ai_threads.findUnique({
      where: { id },
    });

    if (!thread || thread.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await prisma.ai_messages.findMany({
      where: { thread_id: id },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/ai/threads/[id]/messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
