import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export type AiTraceEvent = {
  traceId: string;
  tenantId: string | null;
  feature: "drug_safety" | "analytics";
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  fallback: boolean;
  error?: string;
  timestamp: string;
};

export function createTraceId(): string {
  return randomUUID();
}

export function extractTokenUsage(completion: {
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
}): { inputTokens: number; outputTokens: number } {
  return {
    inputTokens: completion.usage?.prompt_tokens ?? 0,
    outputTokens: completion.usage?.completion_tokens ?? 0,
  };
}

export function recordAiTrace(event: AiTraceEvent): void {
  prisma.ai_trace_events
    .create({
      data: {
        trace_id: event.traceId,
        tenant_id: event.tenantId ?? null,
        feature: event.feature,
        model: event.model,
        input_tokens: event.inputTokens,
        output_tokens: event.outputTokens,
        latency_ms: event.latencyMs,
        success: event.success,
        fallback: event.fallback,
        error: event.error ?? null,
      },
    })
    .catch((err) => {
      console.error("[AI Trace] Failed to persist event:", err);
    });
}