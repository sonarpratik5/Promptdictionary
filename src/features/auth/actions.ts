"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { credentialsFromFormData, safeAuthRedirect, validateCredentials, validateEmail, validateNewPassword } from "./credentials";

export type AuthState = { error?: string; message?: string };

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const validation = validateCredentials("sign-in", credentialsFromFormData(formData));
  if ("error" in validation) return validation;
  const { email, password } = validation.credentials;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Authentication is unavailable." };
  }
  redirect(safeAuthRedirect(formData.get("next")));
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const validation = validateCredentials("sign-up", credentialsFromFormData(formData));
  if ("error" in validation) return validation;
  const { email, password } = validation.credentials;
  try {
    const supabase = await createSupabaseServerClient();
    const callback = new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
    callback.searchParams.set("next", safeAuthRedirect(formData.get("next")));
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback.toString() } });
    if (error) return { error: error.message };
    if (!data.session) return { message: "Check your email to confirm your account, then sign in." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Authentication is unavailable." };
  }
  redirect(safeAuthRedirect(formData.get("next")));
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const validation = validateEmail(formData.get("email"));
  if ("error" in validation) return validation;

  try {
    const supabase = await createSupabaseServerClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const redirectTo = new URL("/auth/callback?next=/auth/reset", siteUrl).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(validation.email, { redirectTo });
    if (error) return { error: "We couldn’t send a reset email. Please try again." };
  } catch {
    return { error: "We couldn’t send a reset email. Please try again." };
  }

  // Do not reveal whether this address has an account.
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function resetPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const validation = validateNewPassword(formData.get("password"), formData.get("confirmation"));
  if ("error" in validation) return validation;

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password: validation.password });
    if (error) return { error: "Your reset link has expired. Request a new one and try again." };
  } catch {
    return { error: "Your reset link has expired. Request a new one and try again." };
  }

  redirect("/auth?reset=success");
}
