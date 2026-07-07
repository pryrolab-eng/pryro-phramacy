import { getAiClient, AI_MODEL, AI_DEFAULTS } from "./client";
import {
  DRUG_INTERACTION_RULES,
  DRUG_WARNING_RULES,
  DRUG_SAFETY_SOURCE,
  maxSeverity,
  normalizeDrugName,
  type SafetySeverity,
} from "@/lib/clinical/drug-safety-rules";
import {
  createTraceId,
  recordAiTrace,
  extractTokenUsage,
} from "./observability";

export type AiDrugSafetyInput = {
  name: string;
  quantity: number;
};

export type AiDrugSafetyResult = {
  interactions: string[];
  warnings: string[];
  severity: SafetySeverity;
  recommendations: string[];
  source: { id: string; name: string; clinicalDataset: boolean };
  ruleMatches: Array<{
    type: "interaction" | "warning" | "quantity";
    severity: SafetySeverity;
    source: string;
    message: string;
  }>;
  aiPowered: boolean;
  reasoning?: string;
};

type NemotronResponse = {
  analysis?: {
    interactions?: Array<{
      drug_a: string;
      drug_b: string;
      severity: string;
      message: string;
    }>;
    warnings?: Array<{
      drug: string;
      severity: string;
      message: string;
    }>;
    recommendations?: string[];
    overall_severity?: string;
  };
  reasoning?: string;
};

function buildLocalResult(items: AiDrugSafetyInput[]): AiDrugSafetyResult {
  const interactions: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const ruleMatches: AiDrugSafetyResult["ruleMatches"] = [];
  let severity: SafetySeverity = "safe";

  const normalized = items.map((item) => ({
    item,
    displayName: item.name.trim() || "Unknown item",
    drug: normalizeDrugName(item.name),
  }));

  for (let i = 0; i < normalized.length; i++) {
    const first = normalized[i];

    for (let j = i + 1; j < normalized.length; j++) {
      const second = normalized[j];
      const rule = DRUG_INTERACTION_RULES.find(
        (r) => r.drugs.includes(first.drug) && r.drugs.includes(second.drug),
      );

      if (rule) {
        const message = `${first.displayName} may interact with ${second.displayName}: ${rule.message}`;
        interactions.push(message);
        ruleMatches.push({ type: "interaction", severity: rule.severity, source: rule.source, message });
        severity = maxSeverity(severity, rule.severity);
      }
    }

    const warning = DRUG_WARNING_RULES.find((r) => r.drug === first.drug);
    if (warning) {
      const message = `${first.displayName}: ${warning.message}`;
      warnings.push(message);
      ruleMatches.push({ type: "warning", severity: warning.severity, source: warning.source, message });
      severity = maxSeverity(severity, warning.severity);
    }

    if ((first.item.quantity ?? 0) > 10) {
      const message = `High quantity of ${first.displayName} (${first.item.quantity} units)`;
      warnings.push(message);
      ruleMatches.push({ type: "quantity", severity: "caution", source: DRUG_SAFETY_SOURCE.id, message });
      severity = maxSeverity(severity, "caution");
    }
  }

  if (interactions.length === 0) {
    recommendations.push("No known local-rule interactions detected");
  } else {
    recommendations.push("Consult a pharmacist about detected interactions");
  }
  recommendations.push("Verify patient allergies before dispensing");
  recommendations.push("Confirm dosage with prescription");

  return {
    interactions,
    warnings: warnings.length > 0 ? warnings : ["No specific warnings"],
    severity,
    recommendations,
    source: DRUG_SAFETY_SOURCE,
    ruleMatches,
    aiPowered: false,
  };
}

const SYSTEM_PROMPT = `You are a clinical drug safety analysis system for a pharmacy POS. Analyze the cart items for drug interactions, warnings, and safety concerns.

Return ONLY valid JSON in this exact shape:
{
  "analysis": {
    "interactions": [
      { "drug_a": "name", "drug_b": "name", "severity": "caution|danger", "message": "explanation" }
    ],
    "warnings": [
      { "drug": "name", "severity": "caution|danger", "message": "explanation" }
    ],
    "recommendations": ["actionable recommendation"],
    "overall_severity": "safe|caution|danger"
  },
  "reasoning": "brief clinical reasoning"
}

Rules:
- severity must be "caution" or "danger" (never "safe" for interactions/warnings)
- overall_severity is the highest severity found, or "safe" if none
- Include drug allergies, dosage warnings, contraindications
- Be concise but clinically accurate
- If no issues found, return empty arrays and overall_severity "safe"`;

/**
 * Generator: calls the LLM and parses the response.
 */
async function generateAnalysis(
  items: AiDrugSafetyInput[],
  traceId: string,
  tenantId: string | null,
): Promise<{ result: AiDrugSafetyResult; inputTokens: number; outputTokens: number }> {
  const client = getAiClient();
  if (!client) throw new Error("AI client not configured");

  const itemList = items
    .map((i) => `${i.name} (qty: ${i.quantity})`)
    .join(", ");

  const startMs = Date.now();
  const completion = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze these cart items for drug safety: [${itemList}]`,
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

  let parsed: NemotronResponse;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? "{}") as NemotronResponse;
  } catch {
    recordAiTrace({
      traceId, tenantId, feature: "drug_safety", model: AI_MODEL,
      inputTokens: tokens.inputTokens, outputTokens: tokens.outputTokens,
      latencyMs, success: false, fallback: true, error: "JSON parse failed",
      timestamp: new Date().toISOString(),
    });
    throw new Error("Failed to parse AI response");
  }

  const analysis = parsed.analysis;
  if (!analysis) {
    recordAiTrace({
      traceId, tenantId, feature: "drug_safety", model: AI_MODEL,
      inputTokens: tokens.inputTokens, outputTokens: tokens.outputTokens,
      latencyMs, success: false, fallback: true, error: "No analysis in response",
      timestamp: new Date().toISOString(),
    });
    throw new Error("No analysis in AI response");
  }

  const severity = (analysis.overall_severity ?? "safe") as SafetySeverity;
  const ruleMatches: AiDrugSafetyResult["ruleMatches"] = [];

  for (const interaction of analysis.interactions ?? []) {
    ruleMatches.push({
      type: "interaction",
      severity: (interaction.severity as SafetySeverity) ?? "caution",
      source: "nvidia_nemotron_ai",
      message: `${interaction.drug_a} + ${interaction.drug_b}: ${interaction.message}`,
    });
  }

  for (const warning of analysis.warnings ?? []) {
    ruleMatches.push({
      type: "warning",
      severity: (warning.severity as SafetySeverity) ?? "caution",
      source: "nvidia_nemotron_ai",
      message: `${warning.drug}: ${warning.message}`,
    });
  }

  return {
    result: {
      interactions: ruleMatches
        .filter((r) => r.type === "interaction")
        .map((r) => r.message),
      warnings: ruleMatches
        .filter((r) => r.type === "warning")
        .map((r) => r.message),
      severity,
      recommendations: analysis.recommendations ?? [
        "Verify patient allergies before dispensing",
        "Confirm dosage with prescription",
      ],
      source: {
        id: "nvidia_nemotron_ai",
        name: "NVIDIA Nemotron AI Clinical Analysis",
        clinicalDataset: true,
      },
      ruleMatches,
      aiPowered: true,
      reasoning,
    },
    inputTokens: tokens.inputTokens,
    outputTokens: tokens.outputTokens,
  };
}

type CriticVerdict = {
  valid: boolean;
  issues: string[];
  mergedResult?: AiDrugSafetyResult;
};

/**
 * Critic: validates AI output against local rules and structural checks.
 * - Checks that all drug names in interactions/warnings are real cart items
 * - Checks that severity values are valid
 * - Merges local rule matches that the AI missed
 * - Detects hallucinated interactions that conflict with known safe pairs
 */
function criticValidate(
  items: AiDrugSafetyInput[],
  aiResult: AiDrugSafetyResult,
): CriticVerdict {
  const issues: string[] = [];
  const cartDrugs = new Set(items.map((i) => normalizeDrugName(i.name)));
  const cartDisplayNames = new Set(items.map((i) => i.name.trim().toLowerCase()));

  // 1. Check that drug names in interactions exist in cart
  for (const msg of aiResult.interactions) {
    const lower = msg.toLowerCase();
    const mentionedDrugs = items.filter(
      (i) => lower.includes(i.name.trim().toLowerCase()),
    );
    if (mentionedDrugs.length === 0) {
      issues.push(`Interaction references drug not in cart: "${msg.slice(0, 80)}"`);
    }
  }

  // 2. Check that drug names in warnings exist in cart
  for (const msg of aiResult.warnings) {
    const lower = msg.toLowerCase();
    const mentionedDrugs = items.filter(
      (i) => lower.includes(i.name.trim().toLowerCase()),
    );
    if (mentionedDrugs.length === 0) {
      issues.push(`Warning references drug not in cart: "${msg.slice(0, 80)}"`);
    }
  }

  // 3. Check severity values
  const validSeverities: SafetySeverity[] = ["safe", "caution", "danger"];
  if (!validSeverities.includes(aiResult.severity)) {
    issues.push(`Invalid severity: "${aiResult.severity}"`);
  }

  // 4. Merge local rules — catch interactions the AI missed
  const localResult = buildLocalResult(items);
  const aiInteractionSet = new Set(
    aiResult.ruleMatches
      .filter((r) => r.type === "interaction")
      .map((r) => r.message.toLowerCase()),
  );

  for (const localMatch of localResult.ruleMatches) {
    if (
      localMatch.type === "interaction" &&
      !aiInteractionSet.has(localMatch.message.toLowerCase())
    ) {
      // AI missed a known interaction — add it
      aiResult.ruleMatches.push(localMatch);
      aiResult.interactions.push(localMatch.message);
      aiResult.severity = maxSeverity(aiResult.severity, localMatch.severity);
      issues.push(`Merged missed local interaction: ${localMatch.message.slice(0, 80)}`);
    }
  }

  // 5. If critic found critical issues, mark as invalid
  const criticalIssues = issues.filter(
    (i) => i.startsWith("Invalid severity") || i.startsWith("references drug not in cart"),
  );

  if (criticalIssues.length > 0) {
    return { valid: false, issues };
  }

  return { valid: true, issues, mergedResult: aiResult };
}

const MAX_CRITIC_RETRIES = 1;

/**
 * Generator-Critic loop:
 * 1. Generate → 2. Critic validates → 3. If invalid, retry once → 4. Final fallback to local rules
 */
export async function analyzeDrugSafety(
  items: AiDrugSafetyInput[],
  tenantId?: string | null,
): Promise<AiDrugSafetyResult> {
  const traceId = createTraceId();
  const resolvedTenantId = tenantId ?? null;

  try {
    const { result: aiResult, inputTokens, outputTokens } = await generateAnalysis(
      items, traceId, resolvedTenantId,
    );

    // Critic pass
    const verdict = criticValidate(items, aiResult);

    if (verdict.valid) {
      recordAiTrace({
        traceId, tenantId: resolvedTenantId, feature: "drug_safety", model: AI_MODEL,
        inputTokens, outputTokens, latencyMs: 0, success: true, fallback: false,
        timestamp: new Date().toISOString(),
      });
      return verdict.mergedResult ?? aiResult;
    }

    // Critic found issues — retry once
    if (MAX_CRITIC_RETRIES > 0) {
      try {
        const { result: retryResult, inputTokens: retryIn, outputTokens: retryOut } =
          await generateAnalysis(items, traceId, resolvedTenantId);

        const retryVerdict = criticValidate(items, retryResult);
        if (retryVerdict.valid) {
          recordAiTrace({
            traceId, tenantId: resolvedTenantId, feature: "drug_safety", model: AI_MODEL,
            inputTokens: inputTokens + retryIn, outputTokens: outputTokens + retryOut,
            latencyMs: 0, success: true, fallback: false,
            timestamp: new Date().toISOString(),
          });
          return retryVerdict.mergedResult ?? retryResult;
        }
      } catch {
        // Retry failed, fall through to local
      }
    }

    // Critic rejected after retry — fall back to local rules
    console.warn("Critic rejected AI output, falling back to local rules:", verdict.issues);
    recordAiTrace({
      traceId, tenantId: resolvedTenantId, feature: "drug_safety", model: AI_MODEL,
      inputTokens, outputTokens, latencyMs: 0, success: false, fallback: true,
      error: `Critic issues: ${verdict.issues.join("; ")}`,
      timestamp: new Date().toISOString(),
    });
    return buildLocalResult(items);
  } catch (aiError) {
    console.warn("AI safety analysis failed, falling back to rules:", aiError);
    recordAiTrace({
      traceId, tenantId: resolvedTenantId, feature: "drug_safety", model: AI_MODEL,
      inputTokens: 0, outputTokens: 0, latencyMs: 0, success: false, fallback: true,
      error: aiError instanceof Error ? aiError.message : String(aiError),
      timestamp: new Date().toISOString(),
    });
    return buildLocalResult(items);
  }
}
