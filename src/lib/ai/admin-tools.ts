import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

// ─── Tool Types ────────────────────────────────────────────────

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// ─── Platform Stats ────────────────────────────────────────────

export async function getPlatformStats(): Promise<ToolResult> {
  try {
    const [
      totalPharmacies,
      activePharmacies,
      totalUsers,
      totalSales,
      recentSignups,
    ] = await Promise.all([
      prisma.pharmacies.count(),
      prisma.pharmacies.count({ where: { status: "active" } }),
      prisma.staff.count(),
      prisma.sales.aggregate({ _sum: { total_amount: true }, where: { created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.staff.count({
        where: { created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      success: true,
      data: {
        totalPharmacies,
        activePharmacies,
        totalUsers,
        monthlyRevenue: totalSales._sum.total_amount ?? 0,
        recentSignups,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── List Pharmacies ───────────────────────────────────────────

export async function listAllPharmacies(
  params: { status?: string; limit?: number } = {},
): Promise<ToolResult> {
  try {
    const pharmacies = await prisma.pharmacies.findMany({
      where: params.status ? { status: params.status as "active" | "inactive" | "suspended" | "trial" } : undefined,
      take: params.limit ?? 20,
      orderBy: { created_at: "desc" },
      include: { _count: { select: { pharmacy_users: true } } },
    });

    return {
      success: true,
      data: pharmacies.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        userCount: p._count.pharmacy_users,
        createdAt: p.created_at,
        email: p.email,
        phone: p.phone,
        address: p.address,
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Subscription Overview ─────────────────────────────────────

export async function getSubscriptionOverview(): Promise<ToolResult> {
  try {
    const subscriptions = await prisma.subscriptions.groupBy({
      by: ["plan_id", "status"],
      _count: true,
    });

    const plans = await prisma.subscription_plans.findMany({
      select: { id: true, name: true, price: true },
    });

    return {
      success: true,
      data: {
        byStatus: subscriptions.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        plans,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── AI Usage Stats ────────────────────────────────────────────

export async function getAiUsageStats(): Promise<ToolResult> {
  try {
    const stats = await prisma.ai_trace_events.groupBy({
      by: ["feature", "success"],
      _count: true,
      _sum: { input_tokens: true, output_tokens: true },
      _avg: { latency_ms: true },
    });

    return {
      success: true,
      data: stats.map((s) => ({
        feature: s.feature,
        success: s.success,
        count: s._count,
        totalInputTokens: s._sum.input_tokens,
        totalOutputTokens: s._sum.output_tokens,
        avgLatencyMs: s._avg.latency_ms,
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── System Health ─────────────────────────────────────────────

export async function getSystemHealth(): Promise<ToolResult> {
  try {
    const recentErrors = await prisma.ai_trace_events.count({
      where: {
        success: false,
        created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const totalCallsToday = await prisma.ai_trace_events.count({
      where: {
        created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    return {
      success: true,
      data: {
        recentErrors,
        totalCallsToday,
        errorRate: totalCallsToday > 0 ? (recentErrors / totalCallsToday) * 100 : 0,
        status: recentErrors === 0 ? "healthy" : recentErrors < 10 ? "degraded" : "unhealthy",
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Create Pharmacy ─────────────────────────────────────────

export async function createPharmacy(
  params: {
    name: string;
    license_number?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
  },
): Promise<ToolResult> {
  try {
    const name = params.name?.trim();
    if (!name) {
      return { success: false, error: "Pharmacy name is required." };
    }

    const licenseNumber = (
      params.license_number?.trim() || `LIC-${Date.now()}`
    ).slice(0, 200);

    // Check for duplicate license number
    const existing = await prisma.pharmacies.findFirst({
      where: { license_number: licenseNumber },
    });
    if (existing) {
      return {
        success: false,
        error: `A pharmacy with license "${licenseNumber}" already exists.`,
      };
    }

    const pharmacy = await prisma.pharmacies.create({
      data: {
        name,
        license_number: licenseNumber,
        city: params.city?.trim() || "Kigali",
        address: params.address?.trim() || null,
        phone: params.phone?.trim() || null,
        email: params.email?.trim() || null,
        status: "trial",
        subscription_plan: "trial",
      },
    });

    return {
      success: true,
      data: {
        id: pharmacy.id,
        name: pharmacy.name,
        license_number: pharmacy.license_number,
        city: pharmacy.city,
        status: pharmacy.status,
        subscription_plan: pharmacy.subscription_plan,
        created_at: pharmacy.created_at,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Ask User (A2UI Interactive Question) ─────────────────────

type A2UIField = {
  id: string;
  type: "text" | "choice" | "number";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export function buildA2UIQuestion(params: {
  questionId: string;
  question: string;
  fields: A2UIField[];
}) {
  const surfaceId = `ask-${params.questionId}`;

  const components: Record<string, unknown>[] = [
    // Root column
    {
      id: "root",
      component: "Column",
      children: ["question-text", "form-fields", "submit-btn"],
    },
    // Question text
    {
      id: "question-text",
      component: "Text",
      text: params.question,
      style: { fontSize: "16px", fontWeight: "600", marginBottom: "12px" },
    },
  ];

  const dataModel: Record<string, unknown> = {};

  // Add fields
  for (const field of params.fields) {
    if (field.type === "choice" && field.options) {
      components.push({
        id: `field-${field.id}`,
        component: "ChoicePicker",
        label: field.label,
        choices: field.options.map((opt) => ({ id: opt, label: opt })),
      });
    } else if (field.type === "number") {
      components.push({
        id: `field-${field.id}`,
        component: "TextField",
        label: field.label,
        placeholder: field.placeholder ?? "",
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

  // Add submit button
  components.push({
    id: "submit-btn",
    component: "Button",
    label: "Submit",
    action: { name: "submit_answer", surfaceId },
  });

  return {
    a2ui: true,
    messages: [
      {
        version: "v0.9" as const,
        createSurface: { surfaceId, catalogId: "basic" },
      },
      {
        version: "v0.9" as const,
        updateComponents: { surfaceId, components },
      },
      {
        version: "v0.9" as const,
        updateDataModel: { surfaceId, path: "/", value: dataModel },
      },
    ],
    surfaceId,
    questionId: params.questionId,
  };
}

// ─── Tool Registry ─────────────────────────────────────────────

const listPharmaciesParams = z.object({
  status: z.string().optional().describe("Filter by status (active, inactive, suspended)"),
  limit: z.number().optional().describe("Maximum number of results (default 20)"),
});

const createPharmacyParams = z.object({
  name: z.string().describe("Pharmacy name (required)"),
  license_number: z.string().optional().describe("License number (auto-generated if omitted)"),
  city: z.string().optional().describe("City (default: Kigali)"),
  address: z.string().optional().describe("Full address"),
  phone: z.string().optional().describe("Contact phone number"),
  email: z.string().optional().describe("Contact email"),
});

export const adminTools = {
  get_platform_stats: {
    description: "Get platform-wide statistics including pharmacy count, users, and revenue.",
    parameters: z.object({}),
    execute: () => getPlatformStats(),
  },
  list_all_pharmacies: {
    description: "List all pharmacies on the platform with optional status filter.",
    parameters: listPharmaciesParams,
    execute: (params: z.infer<typeof listPharmaciesParams>) =>
      listAllPharmacies(params),
  },
  get_subscription_overview: {
    description: "Get overview of all subscriptions grouped by status.",
    parameters: z.object({}),
    execute: () => getSubscriptionOverview(),
  },
  get_ai_usage_stats: {
    description: "Get AI usage statistics including token usage and latency.",
    parameters: z.object({}),
    execute: () => getAiUsageStats(),
  },
  get_system_health: {
    description: "Get system health status including recent errors and AI call success rate.",
    parameters: z.object({}),
    execute: () => getSystemHealth(),
  },
  create_pharmacy: {
    description: "Create a new pharmacy on the platform. Requires at least a name. The pharmacy starts in trial status.",
    parameters: createPharmacyParams,
    execute: (params: z.infer<typeof createPharmacyParams>) =>
      createPharmacy(params),
  },
  ask_user: {
    description:
      "Ask the user a clarifying question with an interactive form. Use when you need specific information before proceeding. Returns an A2UI surface with input fields.",
    parameters: z.object({
      question: z.string().describe("The question to ask the user"),
      fields: z
        .array(
          z.object({
            id: z.string().describe("Field identifier"),
            type: z
              .enum(["text", "choice", "number"])
              .describe("Field type"),
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
      return {
        success: true,
        data: buildA2UIQuestion({
          questionId,
          question: params.question,
          fields: params.fields,
        }),
      };
    },
  },
};
