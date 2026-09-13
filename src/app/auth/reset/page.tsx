import { redirect } from "next/navigation";
import { PasswordResetForm } from "@/components/password-reset-forms";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResetPage() {
  if (!isSupabaseConfigured()) redirect("/auth/reset-request");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?error=recovery");

  return <main id="main-content" tabIndex={-1} className="mx-auto grid max-w-2xl gap-10 px-5 py-12 md:py-20">
    <div><p className="eyebrow">Account recovery</p><h1 className="mt-3 page-title">Choose a new password.</h1><p className="mt-5 max-w-md text-lg leading-8 text-foreground-muted">Use a password you have not used elsewhere.</p></div>
    <section className="card p-6 md:p-10" aria-label="Set new password"><PasswordResetForm /></section>
  </main>;
}
