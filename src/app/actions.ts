"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  console.log('🔐 LOGIN ATTEMPT:', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log('❌ LOGIN ERROR:', error.message);
    return encodedRedirect("error", "/sign-in", error.message);
  }

  console.log('✅ LOGIN SUCCESS:', data.user?.email);

  // Verify session was created
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    console.log('❌ NO SESSION AFTER LOGIN');
    return encodedRedirect("error", "/sign-in", "Session creation failed");
  }

  // Setup test users if needed
  if (data.user && email.includes('@test.com')) {
    console.log('🧪 SETTING UP TEST USER');
    const role = email.includes('pharmacy') ? 'pharmacy_owner' : 
                 email.includes('pharmacist') ? 'pharmacist' : 'cashier';
    
    try {
      const { data: existingUser } = await supabase
        .from('pharmacy_users')
        .select('user_id')
        .eq('user_id', data.user.id)
        .single();
      
      if (!existingUser) {
        console.log('👤 CREATING USER RECORDS');
        await Promise.all([
          supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            role: role
          }),
          supabase.from('pharmacy_users').upsert({
            pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            user_id: data.user.id,
            role: role,
            branch_id: null,
            is_active: true
          })
        ]);
      }
    } catch (setupError) {
      console.log('❌ USER SETUP ERROR:', setupError);
    }
  }

  console.log('➡️ REDIRECTING TO DASHBOARD');
  redirect("/dashboard");
};

export const signOutAction = async () => {
  const supabase = createClient();
  console.log('🚪 SIGNING OUT');
  await supabase.auth.signOut();
  return redirect("/sign-in");
};