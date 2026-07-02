import Link from "next/link";
import { ShieldX } from "lucide-react";
import { DashboardButton } from "@/components/dashboard";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; ip?: string }>;
}) {
  const params = await searchParams;
  const isIpBlock = params.reason === "ip";
  const clientIp = params.ip?.trim();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
        <ShieldX className="h-7 w-7 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isIpBlock
          ? "Your current network address is not on the allowlist for this workspace. Ask your pharmacy owner or platform admin to add your IP under Settings → Security."
          : "You do not have permission to view this page."}
      </p>
      {clientIp ? (
        <p className="mt-3 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          Detected IP: {clientIp}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <DashboardButton asChild tone="primary" className="rounded-[10px]">
          <Link href="/sign-in">Back to sign in</Link>
        </DashboardButton>
        <DashboardButton asChild tone="outline" className="rounded-[10px]">
          <Link href="/">Home</Link>
        </DashboardButton>
      </div>
    </div>
  );
}
