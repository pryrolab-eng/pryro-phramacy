import { redirect } from "next/navigation";
import { inventoryInsuranceHref } from "@/lib/routes/pharmacy-paths";

/** Legacy formulary URL → Inventory → Insurance tab with import open. */
export default function PharmacyInsuranceFormularyRedirect() {
  redirect(inventoryInsuranceHref({ import: true }));
}
