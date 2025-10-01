import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  if (user.email === 'abdousentore@gmail.com') {
    return redirect("/superadmin");
  }
  
  // Check user's pharmacy access and role
  const { data: userPharmacy, error: pharmacyError } = await supabase
    .from('pharmacy_users')
    .select('pharmacy_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  
  if (!userPharmacy) {
    return redirect("/sign-in?error=no-pharmacy-access");
  }
  
  // Redirect based on role
  if (userPharmacy.role === 'pharmacy_owner' || userPharmacy.role === 'admin') {
    return redirect("/pharmacy-dashboard");
  } else if (userPharmacy.role === 'pharmacist') {
    return redirect("/pharmacist-dashboard");
  } else {
    return redirect("/pharmacy-dashboard"); // Default for other roles
  }
}
