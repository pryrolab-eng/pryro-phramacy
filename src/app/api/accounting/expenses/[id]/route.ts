import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { deleteAccountingExpense } from "@/lib/db/future-feature-settings";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const { id } = await context.params;
    const deleted = await deleteAccountingExpense(id, pharmacyId);

    if (!deleted) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/accounting/expenses/[id]", error);
    return NextResponse.json(
      { error: "Failed to delete accounting expense" },
      { status: 500 },
    );
  }
}
