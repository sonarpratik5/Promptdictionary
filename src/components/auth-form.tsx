"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/features/auth/actions";

export function AuthForm({ mode, next = "/" }: { mode: "sign-in" | "sign-up"; next?: string }) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const isSignIn = mode === "sign-in";
  const alternateHref = isSignIn ? `/auth?mode=sign-up&next=${encodeURIComponent(next)}` : `/auth?next=${encodeURIComponent(next)}`;
  return <form action={formAction} className="mt-8 grid gap-5">
    <input type="hidden" name="next" value={next} />
    <label className="grid gap-2 text-sm font-semibold text-foreground" htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="email" required className="field font-normal" /></label>
    <label className="grid gap-2 text-sm font-semibold text-foreground" htmlFor="password">Password<input id="password" name="password" type="password" autoComplete={isSignIn ? "current-password" : "new-password"} minLength={8} required className="field font-normal" />{!isSignIn && <span className="text-xs font-normal text-foreground-muted">At least 8 characters.</span>}</label>
    {state.error && <p role="alert" className="alert-danger font-semibold">{state.error}</p>}
    {state.message && <p role="status" className="alert-success font-semibold">{state.message}</p>}
    <button type="submit" disabled={pending} className="btn-primary px-4 py-3 disabled:cursor-wait">{pending ? "Working…" : isSignIn ? "Sign in" : "Create account"}</button>
    <p className="text-center text-sm text-foreground-muted">{isSignIn ? "New here?" : "Already have an account?"} <Link href={alternateHref} className="font-bold text-accent hover:underline">{isSignIn ? "Create an account" : "Sign in"}</Link></p>
    {isSignIn && <Link href="/auth/reset-request" className="text-center text-sm font-semibold text-foreground-muted hover:text-accent hover:underline">Forgot your password?</Link>}
  </form>;
}
