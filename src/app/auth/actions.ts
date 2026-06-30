"use server";

import { redirect } from "next/navigation";
import { validateDisplayName } from "@/lib/auth/display-name";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signUpAction(formData: FormData) {
  const email = getString(formData, "email").trim();
  const password = getString(formData, "password");
  const consent = getString(formData, "public_consent");
  const displayName = validateDisplayName(getString(formData, "display_name"));

  if (!email || !password || !displayName.ok || consent !== "on") {
    redirect("/auth/error?reason=signup");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/auth/error?reason=signup");
  }

  let profileFailed = false;

  try {
    const { error: profileError } = await createAdminSupabaseClient()
      .from("profiles")
      .insert({
        id: data.user.id,
        display_name: displayName.value,
        display_name_normalized: displayName.normalized,
      });

    if (profileError) {
      profileFailed = true;
    }
  } catch {
    profileFailed = true;
  }

  if (profileFailed) {
    redirect("/auth/error?reason=profile");
  }

  redirect("/auth/pending");
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email").trim();
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/auth/error?reason=login");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/auth/error?reason=login");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function guestSignInAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    redirect("/auth/error?reason=guest");
  }

  redirect("/practice");
}
