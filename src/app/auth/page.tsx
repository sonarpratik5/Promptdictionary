import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ mode?: string; error?: string; reset?: string }> }) {
  const params = await searchParams;
  const mode = params.mode === "sign-up" ? "sign-up" : "sign-in";
  const confirmationFailed = params.error === "confirmation";
  const recoveryFailed = params.error === "recovery";
  const passwordReset = params.reset === "success";
  return <main id="main-content" tabIndex={-1} className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[.9fr_1.1fr] md:py-20">
    <div className="rounded-2xl bg-background-secondary p-6 md:p-10"><Link href="/" className="back-link">← Back to the library</Link><p className="eyebrow mt-8">Your account</p><h1 className="mt-3 page-title">A space for better ideas.</h1><p className="mt-5 max-w-md text-lg leading-8 text-foreground-muted">Browse, adapt, and copy every prompt without an account. Personal shelves, contributions, and feedback are planned for a future release.</p></div>
    <section className="card p-6 md:p-10" aria-labelledby="auth-heading">
      <h2 id="auth-heading" className="text-2xl font-semibold text-foreground">{mode === "sign-in" ? "Welcome back" : "Create your account"}</h2>
      {confirmationFailed && <div className="alert-danger mt-6" role="alert"><strong>We couldn’t confirm that link.</strong><br />It may have expired or already been used. <Link href="/auth?mode=sign-up" className="font-bold underline">Request a new confirmation email</Link>.</div>}
      {recoveryFailed && <div className="alert-danger mt-6" role="alert"><strong>Your reset link is no longer valid.</strong><br /><Link href="/auth/reset-request" className="font-bold underline">Request a new password reset email</Link>.</div>}
      {passwordReset && <div className="alert-success mt-6" role="status"><strong>Password updated.</strong><br />Sign in with your new password.</div>}
      {!isSupabaseConfigured() ? <div className="alert-notice mt-6"><strong>Sign-in is not available yet.</strong><br />You can still explore and adapt every prompt in the library.</div> : <AuthForm key={mode} mode={mode} />}
    </section>
  </main>;
}
