import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  createAccountingExpense,
  listAccountingExpenses,
} from "@/lib/db/future-feature-settings";

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const params = new URL(request.url).searchParams;
    const expenses = await listAccountingExpenses(pharmacyId, {
      from: parseDateParam(params.get("from")),
      to: parseDateParam(params.get("to")),
    });

    return NextResponse.json({
      expenses: expenses.map((row) => ({
        id: row.id,
        category: row.category,
        amount: Number(row.amount),
        description: row.description,
        expenseDate: row.expense_date,
        source: row.source,
      })),
    });
  } catch (error) {
    console.error("GET /api/accounting/expenses", error);
    return NextResponse.json(
      { error: "Failed to load accounting expenses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const body = (await request.json()) as Record<string, unknown>;
    const category = String(body.category ?? "").trim();
    const amount = Number(body.amount);

    if (!category || !Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { error: "category and a non-negative amount are required" },
        { status: 400 },
      );
    }

    const expense = await createAccountingExpense({
      pharmacyId,
      category,
      amount,
      description:
        typeof body.description === "string" ? body.description.trim() : null,
      expenseDate:
        typeof body.expenseDate === "string" ? body.expenseDate : null,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      expense: {
        id: expense.id,
        category: expense.category,
        amount: Number(expense.amount),
        description: expense.description,
        expenseDate: expense.expense_date,
        source: expense.source,
      },
    });
  } catch (error) {
    console.error("POST /api/accounting/expenses", error);
    return NextResponse.json(
      { error: "Failed to create accounting expense" },
      { status: 500 },
    );
  }
}
