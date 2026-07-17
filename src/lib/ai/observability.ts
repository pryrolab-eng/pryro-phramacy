import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export type AiTraceEvent = {
  traceId: string;
  tenantId: string | null;
  feature: "drug_safety" | "analytics" | "ai_chat" | "ai_admin_chat";
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  fallback: boolean;
  error?: string;
  timestamp: string;
};

export type TokenUsage = { inputTokens: number; outputTokens: number };

export function createTraceId(): string {
  return randomUUID();
}

type UsageLike = {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
} | null | undefined;

/** Read token counts from OpenAI-compatible completion or stream usage payloads. */
export function extractTokenUsage(completion: {
  usage?: UsageLike;
}): TokenUsage {
  const usage = completion.usage;
  return {
    inputTokens: Number(usage?.prompt_tokens ?? usage?.input_tokens ?? 0) || 0,
    outputTokens:
      Number(usage?.completion_tokens ?? usage?.output_tokens ?? 0) || 0,
  };
}

export function addTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
  };
}

/**
 * Ask streaming providers to include usage on the final chunk.
 * OpenAI / NVIDIA NIM honor this; ignored by providers that don't.
 */
export const AI_STREAM_USAGE_OPTIONS = {
  stream: true as const,
  stream_options: { include_usage: true },
};

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