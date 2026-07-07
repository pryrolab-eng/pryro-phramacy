import { redirect } from "next/navigation";
import { inventoryInsuranceHref } from "@/lib/routes/pharmacy-paths";

/** Legacy help URL → Inventory → Insurance tab. */
export default function PharmacyInsuranceHelpRedirect() {
  redirect(inventoryInsuranceHref());
}
