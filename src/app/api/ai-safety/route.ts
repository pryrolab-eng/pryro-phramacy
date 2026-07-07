import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";
import { isEntitlementsEnforced } from "@/lib/subscription/feature-catalog";
import {
  DRUG_SAFETY_SOURCE,
  maxSeverity,
  normalizeDrugName,
  type SafetySeverity,
} from "@/lib/clinical/drug-safety-rules";
import { analyzeDrugSafety, type AiDrugSafetyInput } from "@/lib/ai/drug-safety";

type SafetyItem = {
  name?: string;
  quantity?: number;
};

function itemName(item: SafetyItem): string {
  return typeof item.name === "string" && item.name.trim()
    ? item.name.trim()
    : "Unknown item";
}

function buildLocalResult(items: SafetyItem[]) {
  const interactions: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const ruleMatches: Array<{
    type: "interaction" | "warning" | "quantity";
    severity: SafetySeverity;
    source: string;
    message: string;
  }> = [];
  let severity: SafetySeverity = "safe";

  const {
    DRUG_INTERACTION_RULES,
    DRUG_WARNING_RULES,
  } = require("@/lib/clinical/drug-safety-rules");

  const normalized = items.map((item) => ({
    item,
    displayName: itemName(item),
    drug: normalizeDrugName(itemName(item)),
  }));

  for (let i = 0; i < normalized.length; i++) {
    const first = normalized[i];

    for (let j = i + 1; j < normalized.length; j++) {
      const second = normalized[j];
      const rule = DRUG_INTERACTION_RULES.find(
        (r: { drugs: string[] }) =>
          r.drugs.includes(first.drug) && r.drugs.includes(second.drug),
      );

      if (rule) {
        const message = `${first.displayName} may interact with ${second.displayName}: ${rule.message}`;
        interactions.push(message);
        ruleMatches.push({ type: "interaction", severity: rule.severity, source: rule.source, message });
        severity = maxSeverity(severity, rule.severity);
      }
    }

    const warning = DRUG_WARNING_RULES.find(
      (r: { drug: string }) => r.drug === first.drug,
    );
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

export async function POST(request: NextRequest) {
  try {
    const { items } = (await request.json()) as { items?: SafetyItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          interactions: [],
          warnings: ["No items to analyze"],
          recommendations: ["Add items to cart for safety check"],
          severity: "safe",
          source: DRUG_SAFETY_SOURCE,
          ruleMatches: [],
          aiPowered: false,
        },
      });
    }

    let useAi = false;
    let pharmacyId: string | null = null;

    try {
      const user = await getAuthUser();
      if (user) {
        pharmacyId = await requireUserPharmacyId(user.id);
        if (isEntitlementsEnforced()) {
          const ent = await resolvePharmacyEntitlements(pharmacyId);
          useAi = ent.can("ai.safety");
        } else {
          useAi = true;
        }
      }
    } catch {
      useAi = false;
    }

    let result;
    if (useAi) {
      const aiInputs: AiDrugSafetyInput[] = items.map((item) => ({
        name: itemName(item),
        quantity: item.quantity ?? 1,
      }));
      result = await analyzeDrugSafety(aiInputs, pharmacyId);
    } else {
      result = buildLocalResult(items);
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("POST /api/ai-safety", error);
    return NextResponse.json(
      { success: false, error: "Safety check failed" },
      { status: 500 },
    );
  }
}
