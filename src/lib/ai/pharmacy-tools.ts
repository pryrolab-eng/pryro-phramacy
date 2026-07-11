import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

// ─── Tool Types ────────────────────────────────────────────────

export type PharmacyToolContext = {
  pharmacyId: string;
  branchId?: string | null;
};

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// ─── Inventory Tools ───────────────────────────────────────────

export async function checkInventory(
  ctx: PharmacyToolContext,
  params: { query?: string; lowStock?: boolean; expiringSoon?: boolean },
): Promise<ToolResult> {
  try {
    const where: Record<string, unknown> = {
      pharmacy_id: ctx.pharmacyId,
      ...(ctx.branchId ? { branch_id: ctx.branchId } : {}),
    };

    if (params.query) {
      where.OR = [
        { medication: { name: { contains: params.query, mode: "insensitive" } } },
        { medication: { generic_name: { contains: params.query, mode: "insensitive" } } },
      ];
    }

    if (params.lowStock) {
      where.quantity_in_stock = { lte: 10 };
    }

    if (params.expiringSoon) {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      where.expiry_date = { lte: thirtyDays };
    }

    const items = await prisma.inventory.findMany({
      where,
      include: { medications: true },
      take: 20,
      orderBy: { quantity_in_stock: "asc" },
    });

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        name: item.medications?.name ?? "Unknown",
        genericName: item.medications?.generic_name,
        stock: item.quantity_in_stock,
        batch: item.batch_number,
        expiryDate: item.expiry_date,
        price: item.selling_price,
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Sales Tools ───────────────────────────────────────────────

export async function getSalesSummary(
  ctx: PharmacyToolContext,
  params: { period: "today" | "week" | "month" | "year" },
): Promise<ToolResult> {
  try {
    const now = new Date();
    let startDate: Date;

    switch (params.period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const sales = await prisma.sales.findMany({
      where: {
        pharmacy_id: ctx.pharmacyId,
        ...(ctx.branchId ? { branch_id: ctx.branchId } : {}),
        created_at: { gte: startDate },
      },
      include: { sale_items: true },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0);
    const totalTransactions = sales.length;
    const totalItems = sales.reduce(
      (sum, sale) => sum + sale.sale_items.reduce((s, item) => s + item.quantity, 0),
      0,
    );

    return {
      success: true,
      data: {
        period: params.period,
        totalRevenue,
        totalTransactions,
        totalItems,
        averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Patient Tools ─────────────────────────────────────────────

export async function lookupPatient(
  ctx: PharmacyToolContext,
  params: { query: string },
): Promise<ToolResult> {
  try {
    const patients = await prisma.customers.findMany({
      where: {
        pharmacy_id: ctx.pharmacyId,
        OR: [
          { name: { contains: params.query, mode: "insensitive" } },
          { phone: { contains: params.query } },
        ],
      },
      take: 10,
    });

    return {
      success: true,
      data: patients.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        dateOfBirth: p.date_of_birth,
        gender: p.gender,
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Drug Safety Tools ─────────────────────────────────────────

export async function checkDrugInteractions(
  _ctx: PharmacyToolContext,
  params: { drugs: string[] },
): Promise<ToolResult> {
  try {
    // Import the existing drug safety module
    const { analyzeDrugSafety } = await import("./drug-safety");

    const result = await analyzeDrugSafety(
      params.drugs.map((name) => ({ name, quantity: 1 })),
      _ctx.pharmacyId,
    );

    return {
      success: true,
      data: {
        interactions: result.interactions,
        warnings: result.warnings,
        recommendations: result.recommendations,
        source: result.source,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Stock Update Suggestion ───────────────────────────────────

export const suggestStockUpdateSchema = z.object({
  medicationName: z.string().describe("Name of the medication"),
  currentStock: z.number().describe("Current stock level"),
  suggestedStock: z.number().describe("Suggested new stock level"),
  reason: z.string().describe("Reason for the stock update"),
});

export async function suggestStockUpdate(
  ctx: PharmacyToolContext,
  params: z.infer<typeof suggestStockUpdateSchema>,
): Promise<ToolResult> {
  try {
    const inventory = await prisma.inventory.findFirst({
      where: {
        pharmacy_id: ctx.pharmacyId,
        ...(ctx.branchId ? { branch_id: ctx.branchId } : {}),
        medications: { name: { contains: params.medicationName, mode: "insensitive" } },
      },
      include: { medications: true },
    });

    if (!inventory) {
      return { success: false, error: `Medication "${params.medicationName}" not found` };
    }

    return {
      success: true,
      data: {
        medicationId: inventory.medication_id,
        medicationName: inventory.medications?.name ?? params.medicationName,
        currentStock: inventory.quantity_in_stock,
        suggestedStock: params.suggestedStock,
        reason: params.reason,
        requiresApproval: true,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Tool Registry ─────────────────────────────────────────────

const checkInventoryParams = z.object({
  query: z.string().optional().describe("Search query for medication name"),
  lowStock: z.boolean().optional().describe("Filter for low stock items (<=10 units)"),
  expiringSoon: z.boolean().optional().describe("Filter for items expiring within 30 days"),
});

const getSalesSummaryParams = z.object({
  period: z.enum(["today", "week", "month", "year"]).describe("Time period for the summary"),
});

const lookupPatientParams = z.object({
  query: z.string().describe("Patient name or phone number to search"),
});

const checkDrugInteractionsParams = z.object({
  drugs: z.array(z.string()).describe("List of drug names to check for interactions"),
});

export const pharmacyTools = {
  check_inventory: {
    description: "Check inventory levels for medications. Can filter by query, low stock, or expiring soon.",
    parameters: checkInventoryParams,
    execute: (ctx: PharmacyToolContext, params: z.infer<typeof checkInventoryParams>) =>
      checkInventory(ctx, params),
  },
  get_sales_summary: {
    description: "Get sales summary for a time period (today, week, month, year).",
    parameters: getSalesSummaryParams,
    execute: (ctx: PharmacyToolContext, params: z.infer<typeof getSalesSummaryParams>) =>
      getSalesSummary(ctx, params),
  },
  lookup_patient: {
    description: "Look up patient information by name or phone number.",
    parameters: lookupPatientParams,
    execute: (ctx: PharmacyToolContext, params: z.infer<typeof lookupPatientParams>) =>
      lookupPatient(ctx, params),
  },
  check_drug_interactions: {
    description: "Check for drug interactions between a list of medications.",
    parameters: checkDrugInteractionsParams,
    execute: (ctx: PharmacyToolContext, params: z.infer<typeof checkDrugInteractionsParams>) =>
      checkDrugInteractions(ctx, params),
  },
  suggest_stock_update: {
    description: "Suggest a stock update with reasoning. Requires user approval before execution.",
    parameters: suggestStockUpdateSchema,
    execute: (ctx: PharmacyToolContext, params: z.infer<typeof suggestStockUpdateSchema>) =>
      suggestStockUpdate(ctx, params),
  },
  ask_user: {
    description:
      "Ask the user a clarifying question with an interactive form. Use when you need specific information before proceeding.",
    parameters: z.object({
      question: z.string().describe("The question to ask the user"),
      fields: z
        .array(
          z.object({
            id: z.string().describe("Field identifier"),
            type: z.enum(["text", "choice", "number"]).describe("Field type"),
            label: z.string().describe("Field label"),
            placeholder: z.string().optional(),
            required: z.boolean().optional().default(true),
            options: z
              .array(z.string())
              .optional()
              .describe("Options for choice type"),
          }),
        )
        .describe("Input fields for the question"),
    }),
    execute: (params: {
      question: string;
      fields: {
        id: string;
        type: "text" | "choice" | "number";
        label: string;
        placeholder?: string;
        required?: boolean;
        options?: string[];
      }[];
    }) => {
      const questionId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const surfaceId = `ask-${questionId}`;

      const components: Record<string, unknown>[] = [
        {
          id: "root",
          component: "Column",
          children: ["question-text", ...params.fields.map((f) => `field-${f.id}`), "submit-btn"],
        },
        {
          id: "question-text",
          component: "Text",
          text: params.question,
          style: { fontSize: "16px", fontWeight: "600", marginBottom: "12px" },
        },
      ];

      const dataModel: Record<string, unknown> = {};

      for (const field of params.fields) {
        if (field.type === "choice" && field.options) {
          components.push({
            id: `field-${field.id}`,
            component: "ChoicePicker",
            label: field.label,
            choices: field.options.map((opt) => ({ id: opt, label: opt })),
          });
        } else {
          components.push({
            id: `field-${field.id}`,
            component: "TextField",
            label: field.label,
            placeholder: field.placeholder ?? "",
          });
        }
        dataModel[field.id] = "";
      }

      components.push({
        id: "submit-btn",
        component: "Button",
        label: "Submit",
        action: { name: "submit_answer", surfaceId },
      });

      return {
        success: true,
        data: {
          a2ui: true,
          messages: [
            { version: "v0.9" as const, createSurface: { surfaceId, catalogId: "basic" } },
            { version: "v0.9" as const, updateComponents: { surfaceId, components } },
            { version: "v0.9" as const, updateDataModel: { surfaceId, path: "/", value: dataModel } },
          ],
          surfaceId,
          questionId,
        },
      };
    },
  },
};
