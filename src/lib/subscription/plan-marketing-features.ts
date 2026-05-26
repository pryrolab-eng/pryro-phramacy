/** Labels that are limits/metering — show in stats row, not bullet list. */
const LIMIT_LABEL_PATTERNS =
  /^(user limit|branch slots|transactions per branch|maximum active users|maximum branches)/i;

const POS_DETAIL = new Set([
  "Hold sales",
  "Void sales",
  "Returns",
  "Insurance at POS",
]);

function isLimitLabel(label: string): boolean {
  return LIMIT_LABEL_PATTERNS.test(label.trim());
}

/** Collapse granular catalog labels into shorter marketing bullets. */
export function compressPlanFeatureLabels(features: string[]): string[] {
  const input = features
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && !isLimitLabel(f));

  const has = (label: string) => input.includes(label);
  const out: string[] = [];
  const skip = new Set<string>();

  const push = (label: string) => {
    if (!skip.has(label) && !out.includes(label)) out.push(label);
  };

  if (has("Dashboard")) {
    push("Dashboard");
    skip.add("Dashboard");
  }

  const posExtras = input.filter((f) => POS_DETAIL.has(f));
  if (has("POS access") || posExtras.length > 0) {
    push(
      posExtras.length > 0
        ? "Full POS (sales, holds, returns, insurance)"
        : "Point of sale",
    );
    skip.add("POS access");
    posExtras.forEach((f) => skip.add(f));
  }

  if (has("Inventory") && has("Inventory analytics")) {
    push("Inventory & analytics");
    skip.add("Inventory");
    skip.add("Inventory analytics");
  } else if (has("Inventory")) {
    push("Inventory");
    skip.add("Inventory");
  } else if (has("Inventory analytics")) {
    push("Inventory analytics");
    skip.add("Inventory analytics");
  }

  const crm = ["Customers", "Patients", "Prescriptions"] as const;
  const crmHits = crm.filter((c) => has(c));
  if (crmHits.length >= 2) {
    push("Customers, patients & prescriptions");
    crm.forEach((c) => skip.add(c));
  } else {
    crmHits.forEach((c) => {
      push(c);
      skip.add(c);
    });
  }

  if (has("Sales")) {
    push("Sales");
    skip.add("Sales");
  }
  if (has("Reports")) {
    push("Reports");
    skip.add("Reports");
  }

  if (has("Branches") && has("Create branches")) {
    push("Multi-branch");
    skip.add("Branches");
    skip.add("Create branches");
  } else {
    if (has("Branches")) {
      push("Branches");
      skip.add("Branches");
    }
    if (has("Create branches")) {
      push("Create branches");
      skip.add("Create branches");
    }
  }

  if (has("Staff") && has("Invite staff")) {
    push("Team management");
    skip.add("Staff");
    skip.add("Invite staff");
  } else {
    if (has("Staff")) {
      push("Staff");
      skip.add("Staff");
    }
    if (has("Invite staff")) {
      push("Invite staff");
      skip.add("Invite staff");
    }
  }

  if (has("Settings")) {
    push("Settings");
    skip.add("Settings");
  }
  if (has("Billing")) {
    push("Billing");
    skip.add("Billing");
  }

  for (const f of input) {
    if (!skip.has(f)) push(f);
  }

  return out;
}

export function summarizePlanFeatures(
  features: string[],
  maxVisible = 6,
): { visible: string[]; moreCount: number; all: string[] } {
  const all = compressPlanFeatureLabels(features);
  const visible = all.slice(0, maxVisible);
  return {
    visible,
    moreCount: Math.max(0, all.length - maxVisible),
    all,
  };
}

export function planMarketingBlurb(plan: {
  name: string;
  price: number;
  is_popular?: boolean;
}): string {
  if (plan.price === 0) {
    return "Essential tools to run your pharmacy — no card required.";
  }
  if (plan.is_popular) {
    return "Best for growing pharmacies that need full operations and reporting.";
  }
  const tier = plan.name.toLowerCase();
  if (tier.includes("premium") || tier.includes("enterprise")) {
    return "Everything in Standard plus higher limits for teams and branches.";
  }
  if (tier.includes("standard") || tier.includes("pro")) {
    return "Full daily operations: POS, inventory, CRM, and reports.";
  }
  if (tier.includes("starter") || tier.includes("basic")) {
    return "Core POS and inventory for small pharmacies getting started.";
  }
  return "Flexible plan for your pharmacy team.";
}
