import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, full_name } = body as { name?: string; full_name?: string };

    // Update public.users
    await prisma.public_users.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(full_name !== undefined && { full_name }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/me/profile", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
