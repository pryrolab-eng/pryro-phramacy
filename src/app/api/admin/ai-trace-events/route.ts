import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10)));
    const skip = (page - 1) * pageSize;

    const pharmacyId = searchParams.get("pharmacyId") ?? undefined;
    const feature = searchParams.get("feature") ?? undefined;
    const successParam = searchParams.get("success");
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    type AiTraceWhere = Prisma.ai_trace_eventsWhereInput;
    const where: AiTraceWhere = {};
    if (pharmacyId) where.tenant_id = pharmacyId;
    if (feature && (feature === "drug_safety" || feature === "analytics")) where.feature = feature;
    if (successParam === "true") where.success = true;
    else if (successParam === "false") where.success = false;
    if (from) {
      where.created_at = { gte: new Date(from) };
    }
    if (to) {
      where.created_at = { ...(where.created_at as object), lte: new Date(to) };
    }

    const [events, total, summary] = await Promise.all([
      prisma.ai_trace_events.findMany({ where, orderBy: { created_at: "desc" }, skip, take: pageSize }),
      prisma.ai_trace_events.count({ where }),
      prisma.ai_trace_events.aggregate({
        where,
        _count: { _all: true },
        _sum: { input_tokens: true, output_tokens: true },
        _avg: { latency_ms: true },
      }),
    ]);

    const successWhere = { ...where, success: true } as AiTraceWhere;
    const [successCount, fallbackCount] = await Promise.all([
      prisma.ai_trace_events.count({ where: successWhere }),
      prisma.ai_trace_events.count({ where: { ...where, fallback: true } as AiTraceWhere }),
    ]);

    return NextResponse.json({
      events,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      summary: {
        totalCalls: summary._count._all,
        successCount,
        fallbackCount,
        successRate: summary._count._all > 0 ? Math.round((successCount / summary._count._all) * 100) : 0,
        avgLatencyMs: Math.round(summary._avg.latency_ms ?? 0),
        totalInputTokens: summary._sum.input_tokens ?? 0,
        totalOutputTokens: summary._sum.output_tokens ?? 0,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/ai-trace-events", error);
    return NextResponse.json({ error: "Failed to fetch AI trace events" }, { status: 500 });
  }
}