import { AppEntryGate } from "@/components/auth/app-entry-gate";

/** Post-login entry — resolves role and redirects with a stable loading UX. */
export default function PostAuthEntryPage() {
  return <AppEntryGate />;
}
