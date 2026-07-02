import Link from "next/link";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  return (
    <AuthPageShell
      title="Under maintenance"
      description="Pryrox is temporarily unavailable while we perform upgrades."
      panelPosition="right"
    >
      <div className="mt-8 space-y-4">
        <p className="text-sm text-muted-foreground">
          Pharmacy dashboards and APIs are paused. Platform operators can still
          sign in from the admin console.
        </p>
        <Button asChild className="w-full rounded-[10px]">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    </AuthPageShell>
  );
}
