"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, resetPassword, type AuthState } from "@/features/auth/actions";

function Feedback({ state }: { state: AuthState }) {
  return <>{state.error && <p role="alert" className="alert-danger font-semibold">{state.error}</p>}{state.message && <p role="status" className="alert-success font-semibold">{state.message}</p>}</>;
}

export function PasswordResetRequestForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return <form action={formAction} className="mt-8 grid gap-5">
    <label className="grid gap-2 text-sm font-semibold text-foreground" htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required className="field font-normal" /></label>
    <Feedback state={state} />
    <button type="submit" disabled={pending} className="btn-primary px-4 py-3 disabled:cursor-wait">{pending ? "Sending…" : "Email me a reset link"}</button>
    <Link href="/auth" className="text-center text-sm font-bold text-accent hover:underline">Back to sign in</Link>
  </form>;
}

export function PasswordResetForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(resetPassword, {});
  return <form action={formAction} className="mt-8 grid gap-5">
    <label className="grid gap-2 text-sm font-semibold text-foreground" htmlFor="password">New password<input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="field font-normal" /><span className="text-xs font-normal text-foreground-muted">At least 8 characters.</span></label>
    <label className="grid gap-2 text-sm font-semibold text-foreground" htmlFor="confirmation">Confirm new password<input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required className="field font-normal" /></label>
    <Feedback state={state} />
    <button type="submit" disabled={pending} className="btn-primary px-4 py-3 disabled:cursor-wait">{pending ? "Saving…" : "Save new password"}</button>
  </form>;
}
