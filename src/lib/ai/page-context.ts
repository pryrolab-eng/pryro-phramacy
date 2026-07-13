export type PageContext = {
  version: 1;
  capturedAt: number;
  route: string;
  page: string;
  entity: string;
  filters?: Record<string, unknown>;
  selected?: { id: string; label: string };
  summary?: Record<string, number>;
  capabilities?: string[];
  suggestedActions?: { label: string; toolHint: string }[];
};

export type QuickAction = {
  label: string;
  toolHint: string;
};

export const quickActionsByPage: Record<string, QuickAction[]> = {
  inventory: [
    { label: "Show low stock items", toolHint: "get_low_stock_items" },
    { label: "Find medicines expiring soon", toolHint: "get_expiring_items" },
    { label: "Suggest reorder quantities", toolHint: "create_reorder_suggestion" },
  ],
  pos: [
    { label: "Check this cart for safety", toolHint: "check_cart_interactions" },
    { label: "Explain today's sales", toolHint: "get_sales_summary" },
  ],
  admin: [
    { label: "Summarize insurance partner status", toolHint: "summarize_insurance_partner_status" },
    { label: "Analyze platform revenue trends", toolHint: "get_platform_revenue_summary" },
  ],
  pharmacy_dashboard: [
    { label: "Show today's sales", toolHint: "get_sales_summary" },
    { label: "Check low stock alerts", toolHint: "get_low_stock_items" },
    { label: "View pending prescriptions", toolHint: "get_pending_prescriptions" },
  ],
  patients: [
    { label: "Find patient by name", toolHint: "lookup_patient" },
    { label: "Show patient history", toolHint: "get_patient_history" },
  ],
  prescriptions: [
    { label: "Show pending prescriptions", toolHint: "get_pending_prescriptions" },
    { label: "Check drug interactions", toolHint: "check_drug_interactions" },
  ],
};

export function getQuickActionsForPage(page: string): QuickAction[] {
  return quickActionsByPage[page] ?? [];
}

export function buildPageContext(partial: Omit<PageContext, "version" | "capturedAt">): PageContext {
  return {
    version: 1,
    capturedAt: Date.now(),
    ...partial,
  };
}

export function createInventoryPageContext(params: {
  route: string;
  filters?: Record<string, unknown>;
  selected?: { id: string; label: string };
  summary?: Record<string, number>;
  capabilities?: string[];
}): PageContext {
  return buildPageContext({
    route: params.route,
    page: "Inventory",
    entity: "inventory",
    filters: params.filters,
    selected: params.selected,
    summary: params.summary,
    capabilities: params.capabilities ?? ["canViewInventory", "canCreateReorderSuggestion"],
    suggestedActions: quickActionsByPage.inventory,
  });
}

export function createPosPageContext(params: {
  route: string;
  filters?: Record<string, unknown>;
  selected?: { id: string; label: string };
  summary?: Record<string, number>;
  capabilities?: string[];
}): PageContext {
  return buildPageContext({
    route: params.route,
    page: "POS",
    entity: "pos",
    filters: params.filters,
    selected: params.selected,
    summary: params.summary,
    capabilities: params.capabilities ?? ["canViewPOS", "canCheckInteractions"],
    suggestedActions: quickActionsByPage.pos,
  });
}

export function createAdminPageContext(params: {
  route: string;
  filters?: Record<string, unknown>;
  selected?: { id: string; label: string };
  summary?: Record<string, number>;
  capabilities?: string[];
}): PageContext {
  return buildPageContext({
    route: params.route,
    page: "Admin Dashboard",
    entity: "admin",
    filters: params.filters,
    selected: params.selected,
    summary: params.summary,
    capabilities: params.capabilities ?? ["canViewPlatformMetrics", "canManagePharmacies"],
    suggestedActions: quickActionsByPage.admin,
  });
}

export function createPharmacyDashboardPageContext(params: {
  route: string;
  filters?: Record<string, unknown>;
  selected?: { id: string; label: string };
  summary?: Record<string, number>;
  capabilities?: string[];
}): PageContext {
  return buildPageContext({
    route: params.route,
    page: "Pharmacy Dashboard",
    entity: "pharmacy_dashboard",
    filters: params.filters,
    selected: params.selected,
    summary: params.summary,
    capabilities: params.capabilities ?? ["canViewSales", "canViewInventory"],
    suggestedActions: quickActionsByPage.pharmacy_dashboard,
  });
}

/** Cap page context size to prevent token overflow. */
export function capAiPageContext(ctx: PageContext): PageContext {
  const capped: PageContext = {
    ...ctx,
    capturedAt: ctx.capturedAt,
    version: ctx.version,
    route: ctx.route,
    page: ctx.page,
    entity: ctx.entity,
  };

  if (ctx.filters) {
    const keys = Object.keys(ctx.filters).slice(0, 10);
    capped.filters = Object.fromEntries(
      keys.map((k) => [k, ctx.filters![k]]),
    );
  }

  if (ctx.selected) {
    capped.selected = {
      id: ctx.selected.id.slice(0, 64),
      label: ctx.selected.label.slice(0, 100),
    };
  }

  if (ctx.summary) {
    const keys = Object.keys(ctx.summary).slice(0, 15);
    capped.summary = Object.fromEntries(
      keys.map((k) => [k, ctx.summary![k]]),
    );
  }

  if (ctx.suggestedActions) {
    capped.suggestedActions = ctx.suggestedActions.slice(0, 6);
  }

  if (ctx.capabilities) {
    capped.capabilities = ctx.capabilities.slice(0, 10);
  }

  return capped;
}