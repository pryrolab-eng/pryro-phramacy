import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/routes/admin-paths";

/** Legacy URL → insurance templates (guide removed). */
export default function AdminInsuranceGuideRedirect() {
  redirect(ADMIN_ROUTES.insuranceTemplates);
}
