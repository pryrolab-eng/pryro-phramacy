import { NextRequest, NextResponse } from "next/server";
import {
  DRUG_INTERACTION_RULES,
  DRUG_SAFETY_SOURCE,
  DRUG_WARNING_RULES,
  maxSeverity,
  normalizeDrugName,
  type SafetySeverity,
} from "@/lib/clinical/drug-safety-rules";

type SafetyItem = {
  name?: string;
  quantity?: number;
};

function itemName(item: SafetyItem): string {
  return typeof item.name === "string" && item.name.trim()
    ? item.name.trim()
    : "Unknown item";
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
        },
      });
    }

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

    const normalized = items.map((item) => ({
      item,
      displayName: itemName(item),
      drug: normalizeDrugName(itemName(item)),
    }));

    for (let i = 0; i < normalized.length; i += 1) {
      const first = normalized[i];

      for (let j = i + 1; j < normalized.length; j += 1) {
        const second = normalized[j];
        const rule = DRUG_INTERACTION_RULES.find(
          (candidate) =>
            candidate.drugs.includes(first.drug) &&
            candidate.drugs.includes(second.drug),
        );

        if (rule) {
          const message = `${first.displayName} may interact with ${second.displayName}: ${rule.message}`;
          interactions.push(message);
          ruleMatches.push({
            type: "interaction",
            severity: rule.severity,
            source: rule.source,
            message,
          });
          severity = maxSeverity(severity, rule.severity);
        }
      }

      const warning = DRUG_WARNING_RULES.find((rule) => rule.drug === first.drug);
      if (warning) {
        const message = `${first.displayName}: ${warning.message}`;
        warnings.push(message);
        ruleMatches.push({
          type: "warning",
          severity: warning.severity,
          source: warning.source,
          message,
        });
        severity = maxSeverity(severity, warning.severity);
      }

      if ((first.item.quantity ?? 0) > 10) {
        const message = `High quantity of ${first.displayName} (${first.item.quantity} units)`;
        warnings.push(message);
        ruleMatches.push({
          type: "quantity",
          severity: "caution",
          source: DRUG_SAFETY_SOURCE.id,
          message,
        });
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

    return NextResponse.json({
      success: true,
      result: {
        interactions,
        warnings: warnings.length > 0 ? warnings : ["No specific warnings"],
        recommendations,
        severity,
        source: DRUG_SAFETY_SOURCE,
        ruleMatches,
      },
    });
  } catch (error) {
    console.error("POST /api/ai-safety", error);
    return NextResponse.json(
      { success: false, error: "Safety check failed" },
      { status: 500 },
    );
  }
}
