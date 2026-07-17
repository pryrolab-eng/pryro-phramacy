import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/routes/admin-paths";

/** Legacy admin formulary import removed; use pharmacy insurance medicines. */
export default function AdminInsuranceFormularyRedirect() {
  redirect(ADMIN_ROUTES.insuranceTemplates);
}
