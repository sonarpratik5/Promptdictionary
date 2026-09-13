import Link from "next/link";
import { PasswordResetRequestForm } from "@/components/password-reset-forms";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ResetRequestPage() {
  return <main id="main-content" tabIndex={-1} className="mx-auto grid max-w-2xl gap-10 px-5 py-12 md:py-20">
    <div><Link href="/auth" className="back-link">← Back to sign in</Link><p className="eyebrow mt-8">Account recovery</p><h1 className="mt-3 page-title">Reset your password.</h1><p className="mt-5 max-w-md text-lg leading-8 text-foreground-muted">Enter your email and we’ll send a link if an account exists.</p></div>
    <section className="card p-6 md:p-10" aria-label="Request password reset">
      {!isSupabaseConfigured() ? <div className="alert-notice"><strong>Password recovery is not available yet.</strong><br />Please try again later. You can browse the library without signing in.</div> : <PasswordResetRequestForm />}
    </section>
  </main>;
}
