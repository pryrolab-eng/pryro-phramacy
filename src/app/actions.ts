"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || '';
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        email: email,
      }
    },
  });

  console.log("After signUp", error);


  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: fullName,
          full_name: fullName,
          email: email,
          user_id: user.id,
          token_identifier: user.id,
          created_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Error updating user profile:', updateError);
      }
    } catch (err) {
      console.error('Error in user profile creation:', err);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Handle test users and pharmacy access
  if (data.user) {
    // For superadmin
    if (email === 'abdousentore@gmail.com') {
      await supabase
        .from('pharmacies')
        .upsert({
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Pryrox Admin',
          license_number: 'ADMIN-2024-001',
          owner_id: data.user.id,
          address: 'Kigali, Rwanda',
          phone: '+250 788 000 000',
          email: 'admin@pryrox.com',
          city: 'Kigali',
          status: 'active',
          subscription_plan: 'premium'
        });

      await supabase
        .from('pharmacy_users')
        .upsert({
          pharmacy_id: '00000000-0000-0000-0000-000000000000',
          user_id: data.user.id,
          role: 'admin',
          is_active: true
        });
      
      return redirect("/superadmin");
    }
    // For test users, associate with test pharmacy
    else if (email.includes('@test.com')) {
      const role = email.includes('pharmacy') ? 'pharmacy_owner' : 
                   email.includes('pharmacist') ? 'pharmacist' : 'cashier';
      
      await supabase
        .from('pharmacy_users')
        .upsert({
          pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          user_id: data.user.id,
          role: role,
          is_active: true
        });
      
      // Redirect based on role
      if (role === 'pharmacy_owner') {
        return redirect("/pharmacy-dashboard");
      } else if (role === 'pharmacist') {
        return redirect("/pharmacist-dashboard");
      } else {
        return redirect("/pharmacy-dashboard"); // Default for cashier
      }
    }
    // For any other user without pharmacy access, check if they have access
    else {
      const { data: pharmacyUser } = await supabase
        .from('pharmacy_users')
        .select('pharmacy_id, role')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .single();

      if (!pharmacyUser) {
        return redirect("/sign-in?error=no-pharmacy-access");
      }
      
      // Redirect based on role
      if (pharmacyUser.role === 'pharmacy_owner' || pharmacyUser.role === 'admin') {
        return redirect("/pharmacy-dashboard");
      } else if (pharmacyUser.role === 'pharmacist') {
        return redirect("/pharmacist-dashboard");
      } else {
        return redirect("/pharmacy-dashboard"); // Default
      }
    }
  }

  return redirect("/pharmacy-dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};