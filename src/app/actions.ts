"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Setup test users
  if (data.user && email.includes('@test.com')) {
    const role = email.includes('pharmacy') ? 'pharmacy_owner' : 
                 email.includes('pharmacist') ? 'pharmacist' : 'cashier';
    
    // Update users table
    await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        role: role
      });
    
    // For pharmacists, assign to specific branch (if branch system is implemented)
    const branchId = role === 'pharmacist' ? null : null; // Set specific branch ID for pharmacists
    
    // Update pharmacy_users table
    await supabase
      .from('pharmacy_users')
      .upsert({
        pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        user_id: data.user.id,
        role: role,
        branch_id: branchId, // Pharmacists get assigned to specific branches
        is_active: true
      });
  }

  return redirect("/dashboard");
};

export const signOutAction = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};