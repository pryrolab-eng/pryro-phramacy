import { redirect } from "next/navigation";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

/** Legacy help URL → insurance medicines. */
export default function PharmacyInsuranceHelpRedirect() {
  redirect(PHARMACY_ROUTES.insuranceMedicines);
}
