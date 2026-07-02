import { getAiClient, AI_MODEL, AI_DEFAULTS } from "./client";
import {
  createTraceId,
  recordAiTrace,
  extractTokenUsage,
} from "./observability";

export type AnalyticsData = {
  daily: number[];
  weekly: number[];
  monthly: number[];
  topProducts: Array<{ name: string; sales: number; quantity: number }>;
  customerInsights: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
  };
  revenueLast30: number;
  revenuePrev30: number;
  growthFactor: number;
};

export type AiAnalyticsInsights = {
  summary: string;
  trends: string[];
  recommendations: string[];
  predictions: {
    nextMonthSales: number;
    confidence: "low" | "medium" | "high";
    reasoning: string;
  };
  stockAlerts: Array<{
    product: string;
    predicted: number;
    reason: string;
  }>;
  aiPowered: boolean;
  reasoning?: string;
};

type NemotronAnalyticsResponse = {
  insights?: {
    summary?: string;
    trends?: string[];
    recommendations?: string[];
    predictions?: {
      next_month_sales?: number;
      confidence?: string;
      reasoning?: string;
    };
    stock_alerts?: Array<{
      product?: string;
      predicted?: number;
      reason?: string;
    }>;
  };
  reasoning?: string;
};

const SYSTEM_PROMPT = `You are a pharmacy business analytics AI. Analyze the provided sales data and generate actionable insights.

Return ONLY valid JSON in this exact shape:
{
  "insights": {
    "summary": "2-3 sentence business summary",
    "trends": ["trend observation 1", "trend observation 2"],
    "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"],
    "predictions": {
      "next_month_sales": estimated_number,
      "confidence": "low|medium|high",
      "reasoning": "brief reasoning for prediction"
    },
    "stock_alerts": [
      { "product": "name", "predicted": quantity, "reason": "why this stock level is predicted" }
    ]
  },
  "reasoning": "brief chain-of-thought"
}

Rules:
- Base predictions on the actual data patterns, not made-up numbers
- Be specific to pharmacy business (medication categories, seasonal patterns, etc.)
- Recommendations should be actionable and practical
- Confidence reflects data quality (more data = higher confidence)
- Stock alerts should focus on top-selling products only
- Keep summary concise (2-3 sentences max)`;

function buildFallbackInsights(data: AnalyticsData): AiAnalyticsInsights {
  const nextMonthSales = Math.round(data.revenueLast30 * data.growthFactor);

  const stockAlerts = data.topProducts.slice(0, 3).map((p) => ({
    product: p.name,
    predicted: Math.ceil(p.quantity * data.growthFactor),
    reason: `Based on ${data.growthFactor > 1 ? "growth" : "decline"} trend`,
  }));

  return {
    summary: `Revenue over the last 30 days: ${data.revenueLast30.toLocaleString()} RWF. ${
      data.growthFactor > 1
        ? `Up ${Math.round((data.growthFactor - 1) * 100)}% from previous period.`
        : data.growthFactor < 1
          ? `Down ${Math.round((1 - data.growthFactor) * 100)}% from previous period.`
          : "Stable compared to previous period."
    }`,
    trends: [
      data.growthFactor > 1 ? "Revenue is trending upward" : data.growthFactor < 1 ? "Revenue is trending downward" : "Revenue is stable",
      `${data.customerInsights.newCustomers} new customers this month`,
    ],
    recommendations: [
      data.growthFactor < 1 ? "Consider promotional campaigns to boost sales" : "Maintain current sales strategies",
      "Monitor top-selling product inventory levels",
      "Review customer retention strategies",
    ],
    predictions: {
      nextMonthSales,
      confidence: "low",
      reasoning: "Linear extrapolation based on 30-day trend",
    },
    stockAlerts,
    aiPowered: false,
  };
}

export async function generateAnalyticsInsights(
  data: AnalyticsData,
  tenantId?: string | null,
): Promise<AiAnalyticsInsights> {
  const client = getAiClient();
  if (!client) return buildFallbackInsights(data);

  const traceId = createTraceId();
  const resolvedTenantId = tenantId ?? null;

  const dataSummary = JSON.stringify({
    daily: data.daily,
    weekly: data.weekly,
    monthly: data.monthly,
    topProducts: data.topProducts.slice(0, 5),
    customerInsights: data.customerInsights,
    revenueLast30: data.revenueLast30,
    revenuePrev30: data.revenuePrev30,
    growthFactor: data.growthFactor,
  });

  try {
    const startMs = Date.now();
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this pharmacy sales data and generate insights:\n${dataSummary}`,
        },
      ],
      ...AI_DEFAULTS,
      stream: false,
    });
    const latencyMs = Date.now() - startMs;

    const tokens = extractTokenUsage(completion);
    const content = completion.choices[0]?.message?.content ?? "";
    const rawMessage = completion.choices[0]?.message as unknown as Record<string, unknown>;
    const reasoning = typeof rawMessage?.reasoning_content === "string" ? rawMessage.reasoning_content : undefined;

    let parsed: NemotronAnalyticsResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? "{}") as NemotronAnalyticsResponse;
    } catch {
      recordAiTrace({
        traceId, tenantId: resolvedTenantId, feature: "analytics", model: AI_MODEL,
        inputTokens: tokens.inputTokens, outputTokens: tokens.outputTokens,
        latencyMs, success: false, fallback: true, error: "JSON parse failed",
        timestamp: new Date().toISOString(),
      });
      return buildFallbackInsights(data);
    }

    const insights = parsed.insights;
    if (!insights) {
      recordAiTrace({
        traceId, tenantId: resolvedTenantId, feature: "analytics", model: AI_MODEL,
        inputTokens: tokens.inputTokens, outputTokens: tokens.outputTokens,
        latencyMs, success: false, fallback: true, error: "No insights in response",
        timestamp: new Date().toISOString(),
      });
      return buildFallbackInsights(data);
    }

    recordAiTrace({
      traceId, tenantId: resolvedTenantId, feature: "analytics", model: AI_MODEL,
      inputTokens: tokens.inputTokens, outputTokens: tokens.outputTokens,
      latencyMs, success: true, fallback: false,
      timestamp: new Date().toISOString(),
    });

    return {
      summary: insights.summary ?? buildFallbackInsights(data).summary,
      trends: insights.trends ?? [],
      recommendations: insights.recommendations ?? [],
      predictions: {
        nextMonthSales: insights.predictions?.next_month_sales ?? Math.round(data.revenueLast30 * data.growthFactor),
        confidence: (insights.predictions?.confidence as "low" | "medium" | "high") ?? "low",
        reasoning: insights.predictions?.reasoning ?? "AI-generated prediction",
      },
      stockAlerts: (insights.stock_alerts ?? []).map((alert) => ({
        product: alert.product ?? "Unknown",
        predicted: alert.predicted ?? 0,
        reason: alert.reason ?? "AI prediction",
      })),
      aiPowered: true,
      reasoning,
    };
  } catch (error) {
    console.warn("AI analytics failed, falling back:", error);
    recordAiTrace({
      traceId, tenantId: resolvedTenantId, feature: "analytics", model: AI_MODEL,
      inputTokens: 0, outputTokens: 0, latencyMs: 0, success: false, fallback: true,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return buildFallbackInsights(data);
  }
}
