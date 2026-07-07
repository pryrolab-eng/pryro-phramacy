"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileSpreadsheet,
  HeartPulse,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  UserCheck,
  Users,
} from "lucide-react";
import {
  DashboardPageHeader,
  DashboardSectionCard,
  DashboardButton,
} from "@/components/dashboard";
import {
  PHARMACY_ROUTES,
  inventoryInsuranceHref,
} from "@/lib/routes/pharmacy-paths";

type GuideStep = {
  step: number;
  title: string;
  description: string;
  href: string;
  cta: string;
};

const GO_LIVE_STEPS: GuideStep[] = [
  {
    step: 1,
    title: "Set up your pharmacy",
    description:
      "Complete onboarding, add branches if you have more than one location, and configure insurers in Settings.",
    href: PHARMACY_ROUTES.settings,
    cta: "Open settings",
  },
  {
    step: 2,
    title: "Load your product catalog",
    description:
      "Import inventory from Excel or add products one by one. Categories come from the shared catalog (admin globals + your own).",
    href: PHARMACY_ROUTES.importData,
    cta: "Import center",
  },
  {
    step: 3,
    title: "Add customers (optional)",
    description:
      "Import customers so POS can look them up by phone and pre-fill insurance numbers at checkout.",
    href: `${PHARMACY_ROUTES.customers}?import=1`,
    cta: "Import customers",
  },
  {
    step: 4,
    title: "Map insurer coverage",
    description:
      "Upload each insurer's formulary, review fuzzy name matches, and confirm which products are billable on insurance.",
    href: inventoryInsuranceHref({ import: true }),
    cta: "Insurance tab",
  },
  {
    step: 5,
    title: "Invite staff",
    description:
      "Send login invites to pharmacists and cashiers. Each role sees the navigation they need (POS-first for cashiers).",
    href: `${PHARMACY_ROUTES.staff}?import=1`,
    cta: "Staff & invites",
  },
  {
    step: 6,
    title: "Sell at POS",
    description:
      "Open a cashier shift, add items to the cart, attach a customer/insurer if needed, take payment, and print the receipt.",
    href: PHARMACY_ROUTES.pos,
    cta: "Open POS",
  },
];

type ModuleCard = {
  icon: typeof Package;
  title: string;
  summary: string;
  bullets: string[];
  href: string;
};

const MODULES: ModuleCard[] = [
  {
    icon: Package,
    title: "Inventory",
    summary: "Your product catalog and branch stock.",
    bullets: [
      "Add or import products with category, batch, expiry, and min stock",
      "Alerts tab: low stock and expiring batches",
      "Insurance tab: bulk formulary import + per-product coverage toggles",
    ],
    href: PHARMACY_ROUTES.inventory,
  },
  {
    icon: Users,
    title: "Customers",
    summary: "People who buy at your pharmacy.",
    bullets: [
      "Store name, phone, allergies, and insurance membership number",
      "POS phone lookup fills customer details quickly",
    ],
    href: PHARMACY_ROUTES.customers,
  },
  {
    icon: HeartPulse,
    title: "Insurance",
    summary: "Which products each insurer pays for.",
    bullets: [
      "Insurers configured in Settings; coverage mapped in Inventory → Insurance",
      "Covered items split payment at POS (insurer % + patient copay)",
      "Uncovered items: patient pays 100%",
    ],
    href: inventoryInsuranceHref(),
  },
  {
    icon: ShoppingCart,
    title: "POS",
    summary: "Daily checkout.",
    bullets: [
      "Requires an open cashier shift before completing sales",
      "Cash, insurance, or mixed payment",
      "Receipt prints automatically after a successful sale",
    ],
    href: PHARMACY_ROUTES.pos,
  },
  {
    icon: Receipt,
    title: "Sales",
    summary: "History of completed transactions.",
    bullets: [
      "Find past receipts by date or customer",
      "Re-print invoices from completed sales",
    ],
    href: PHARMACY_ROUTES.sales,
  },
  {
    icon: FileSpreadsheet,
    title: "Reports",
    summary: "Business and insurance analytics.",
    bullets: [
      "Sales trends, inventory value, insurance claims",
      "Filter by branch when you operate multiple locations",
    ],
    href: PHARMACY_ROUTES.reports,
  },
  {
    icon: UserCheck,
    title: "Staff",
    summary: "Team access.",
    bullets: [
      "Owner: full workspace",
      "Pharmacist: clinical + inventory + POS",
      "Cashier/staff: POS, sales, customers",
    ],
    href: PHARMACY_ROUTES.staff,
  },
  {
    icon: Building2,
    title: "Branches",
    summary: "Multi-location operations.",
    bullets: [
      "Stock is tracked per branch",
      "Transfers move batches between branches",
      "Dashboard and reports can filter by branch",
    ],
    href: PHARMACY_ROUTES.branches,
  },
  {
    icon: Settings,
    title: "Settings",
    summary: "Pharmacy profile, insurers, billing, security.",
    bullets: [
      "Add insurance providers and coverage percentages",
      "Manage subscription and pharmacy branding",
    ],
    href: PHARMACY_ROUTES.settings,
  },
];

export function PharmacySystemGuidePanel() {
  return (
    <>
      <DashboardPageHeader
        title="How Pryrox works"
        description="A practical guide for pharmacy owners and staff — from first import to daily sales and receipts."
      />

      <DashboardSectionCard
        title="The big picture"
        description="Everything in Pryrox belongs to your pharmacy tenant."
        className="mb-4"
        contentClassName="space-y-4 text-sm text-neutral-600 dark:text-neutral-400"
      >
        <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            Pharmacy → Branches → Staff → Daily operations
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              <strong>One pharmacy account</strong> — your business, subscription, and insurers
            </li>
            <li>
              <strong>Branches</strong> — each location has its own stock; HQ can transfer between
              them
            </li>
            <li>
              <strong>Staff roles</strong> — owners manage everything; cashiers focus on POS
            </li>
            <li>
              <strong>Catalog first</strong> — inventory must exist before insurance coverage or
              POS sales
            </li>
          </ul>
        </div>
        <p>
          Recommended path: load products → map insurance (if used) → invite team → open shift →
          sell → receipt prints → review in Sales and Reports.
        </p>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Go-live checklist"
        description="Follow this order when setting up a new pharmacy or migrating from spreadsheets."
        className="mb-4"
        contentClassName="space-y-3"
      >
        {GO_LIVE_STEPS.map((item) => (
          <div
            key={item.step}
            className="flex flex-col gap-3 rounded-lg border border-neutral-200/80 p-4 sm:flex-row sm:items-start sm:justify-between dark:border-neutral-800"
          >
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {item.step}
              </span>
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {item.description}
                </p>
              </div>
            </div>
            <DashboardButton tone="outline" size="sm" className="shrink-0" asChild>
              <Link href={item.href}>
                {item.cta}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </DashboardButton>
          </div>
        ))}
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Module guide"
        description="What each area of the system is for."
        className="mb-4"
        contentClassName="grid gap-4 md:grid-cols-2"
      >
        {MODULES.map((mod) => (
          <div
            key={mod.title}
            className="flex flex-col rounded-lg border border-neutral-200/80 p-4 dark:border-neutral-800"
          >
            <div className="mb-2 flex items-center gap-2">
              <mod.icon className="h-4 w-4 text-primary" />
              <h3 className="font-medium">{mod.title}</h3>
            </div>
            <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">{mod.summary}</p>
            <ul className="mb-4 flex-1 list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
              {mod.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <Link
              href={mod.href}
              className="text-sm font-medium text-primary hover:underline"
            >
              Go to {mod.title.toLowerCase()} →
            </Link>
          </div>
        ))}
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Daily workflows"
        description="Typical day for common roles."
        contentClassName="grid gap-4 md:grid-cols-2 text-sm"
      >
        <div className="rounded-lg border border-neutral-200/80 p-4 dark:border-neutral-800">
          <h3 className="font-medium">Pharmacy owner / manager</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-neutral-600 dark:text-neutral-400">
            <li>Check dashboard for low stock and today&apos;s sales</li>
            <li>Review expiring batches in Inventory → Alerts</li>
            <li>Import new stock or adjust quantities after deliveries</li>
            <li>Upload updated insurer formularies when received</li>
            <li>Review Reports for claims and revenue</li>
          </ol>
        </div>
        <div className="rounded-lg border border-neutral-200/80 p-4 dark:border-neutral-800">
          <h3 className="font-medium">Cashier / front desk</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-neutral-600 dark:text-neutral-400">
            <li>Open cashier shift on POS</li>
            <li>Look up customer by phone (optional)</li>
            <li>Scan/search products → add to cart</li>
            <li>Select insurer if customer has coverage</li>
            <li>Take payment → receipt prints → close shift at end of day</li>
          </ol>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Insurance sale (step by step)"
        className="mt-4"
        contentClassName="space-y-3 text-sm text-neutral-600 dark:text-neutral-400"
      >
        <ol className="list-decimal space-y-2 pl-5">
          <li>Product exists in inventory with stock at your branch</li>
          <li>Product is marked <strong>covered</strong> for that insurer (Inventory → Insurance)</li>
          <li>At POS: select insurer + enter membership number</li>
          <li>Add covered products — system calculates insurer vs patient amounts</li>
          <li>Complete sale — receipt shows the split; claim is recorded for reports</li>
        </ol>
        <DashboardButton tone="outline" asChild>
          <Link href={inventoryInsuranceHref({ import: true })}>
            Practice with formulary import
          </Link>
        </DashboardButton>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Practice with demo data"
        className="mt-4"
        contentClassName="text-sm text-neutral-600 dark:text-neutral-400"
      >
        <p>
          On the Import center you can load sample products and customers, then use the downloadable
          RSSB formulary file to practice fuzzy matching before going live with real data.
        </p>
        <DashboardButton tone="primary" className="mt-3" asChild>
          <Link href={PHARMACY_ROUTES.importData}>Open import center</Link>
        </DashboardButton>
      </DashboardSectionCard>
    </>
  );
}
