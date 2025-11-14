import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";

export default async function Dashboard() {
  console.log('🏠 DASHBOARD PAGE ACCESSED');
  
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log('👤 DASHBOARD USER CHECK:', {
    hasUser: !!user,
    userEmail: user?.email,
    error: userError?.message
  });

  if (!user || userError) {
    console.log('➡️ DASHBOARD: No user, redirecting to sign-in');
    redirect("/sign-in");
  }

  if (user.email === 'abdousentore@gmail.com') {
    console.log('➡️ DASHBOARD: Superadmin detected, redirecting');
    redirect("/superadmin");
  }
  
  // Check user's pharmacy access and role
  const { data: userPharmacy, error: pharmacyError } = await supabase
    .from('pharmacy_users')
    .select('pharmacy_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();
  
  console.log('🏥 PHARMACY ACCESS CHECK:', {
    hasAccess: !!userPharmacy,
    role: userPharmacy?.role,
    error: pharmacyError?.message
  });
  
  if (!userPharmacy) {
    console.log('❌ DASHBOARD: No pharmacy access found');
    // For test users, try to create pharmacy access
    if (user.email?.includes('@test.com')) {
      console.log('🧪 DASHBOARD: Creating pharmacy access for test user');
      const role = user.email.includes('pharmacy') ? 'pharmacy_owner' : 
                   user.email.includes('pharmacist') ? 'pharmacist' : 'cashier';
      
      const { error: createError } = await supabase.from('pharmacy_users').upsert({
        pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        user_id: user.id,
        role: role,
        branch_id: null,
        is_active: true
      });
      
      if (!createError) {
        console.log('✅ DASHBOARD: Created pharmacy access, redirecting');
        redirect(role === 'pharmacist' ? "/pharmacist-dashboard" : "/pharmacy-dashboard");
      }
    }
    redirect("/sign-in?error=no-pharmacy-access");
  }
  
  // Redirect based on role
  console.log('➡️ DASHBOARD: Redirecting based on role:', userPharmacy.role);
  if (userPharmacy.role === 'pharmacist') {
    redirect("/pharmacist-dashboard");
  } else {
    redirect("/pharmacy-dashboard");
  }
}
