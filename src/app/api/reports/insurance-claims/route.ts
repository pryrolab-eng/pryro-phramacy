import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { createServiceClient } from "../../../../../supabase/service";
import {
  loadInsuranceTemplateForProvider,
  loadMonthlyInsuranceReport,
  resolveInsuranceReportPeriod,
} from "@/lib/insurance/monthly-report";
import { renderInsuranceMonthlyReportHtml } from "@/lib/insurance/render-insurance-report-html";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { guardReportsAccess, entitlementRouteResponse } = await import(
      "@/lib/subscription/route-guards"
    );
    try {
      await guardReportsAccess(supabase, user.id);
    } catch (entErr) {
      const res = entitlementRouteResponse(entErr);
      if (res) return res;
      throw entErr;
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const month = Math.min(
      12,
      Math.max(1, parseInt(searchParams.get("month") ?? String(now.getMonth() + 1), 10) || now.getMonth() + 1),
    );
    const year =
      parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10) ||
      now.getFullYear();

    const providerIdParam = searchParams.get("providerId")?.trim() || null;
    const providerNameParam = searchParams.get("provider")?.trim() || null;

    const admin = createServiceClient();

    let providerId = providerIdParam;
    let providerName = providerNameParam;

    if (providerId && !providerName) {
      const resolved = await resolveInsuranceProvider(
        admin,
        pharmacyId,
        providerId,
      );
      providerName = resolved?.name ?? null;
    }

    const report = await loadMonthlyInsuranceReport(admin, {
      pharmacyId,
      month,
      year,
      providerId,
    });

    let template = null;
    let renderedHtml: string | null = null;
    let renderedCss: string | null = null;

    if (providerName) {
      template = await loadInsuranceTemplateForProvider(
        admin,
        providerName,
        pharmacyId,
      );
      const rendered = renderInsuranceMonthlyReportHtml(report, {
        template,
        providerName,
      });
      renderedHtml = rendered.html;
      renderedCss = rendered.css;
    }

    const period = resolveInsuranceReportPeriod(month, year);

    return NextResponse.json({
      month: period.month,
      year: period.year,
      period: { from: period.from, to: period.to },
      pharmacy: report.pharmacy,
      claims: report.claims,
      summary: {
        totalClaims: report.summary.totalClaims,
        totalAmount: report.summary.totalInsurerAmount,
        totalPatientCopay: report.summary.totalPatientCopay,
        byInsurance: Object.fromEntries(
          Object.entries(report.summary.byInsurance).map(([name, row]) => [
            name,
            row.insurerAmount,
          ]),
        ),
        byInsuranceDetail: report.summary.byInsurance,
      },
      template: template
        ? {
            id: template.id,
            name: template.name,
            insurance_provider: template.insurance_provider,
          }
        : null,
      renderedHtml,
      renderedCss,
    });
  } catch (error) {
    console.error("GET /api/reports/insurance-claims", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load insurance claims report",
      },
      { status: 500 },
    );
  }
}
