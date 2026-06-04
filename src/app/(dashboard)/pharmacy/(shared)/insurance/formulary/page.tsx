import { redirect } from "next/navigation";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

/** Legacy URL → insurance medicines manager. */
export default function PharmacyInsuranceFormularyRedirect() {
  redirect(PHARMACY_ROUTES.insuranceMedicines);
}
