"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateProfile, type ProfileMutationState } from "@/features/profiles/mutations";
import type { Profile } from "@/features/profiles/types";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState<ProfileMutationState, FormData>(updateProfile, {});
  return (
    <form action={action} className="card grid gap-4 p-6">
      <label className="grid gap-2 text-sm font-semibold" htmlFor="handle">Handle<span className="block text-xs font-normal text-foreground-muted">Your public page: /u/&lt;handle&gt;. Lowercase letters, numbers, hyphens, or underscores.</span><input id="handle" name="handle" className="field font-normal" defaultValue={profile?.handle} minLength={2} maxLength={30} required pattern="[a-z0-9][a-z0-9_-]{1,29}" /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="displayName">Display name<input id="displayName" name="displayName" className="field font-normal" defaultValue={profile?.displayName} maxLength={60} required /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="bio">Bio <span className="text-xs font-normal text-foreground-muted">Optional</span><textarea id="bio" name="bio" className="field min-h-24 font-normal" maxLength={500} defaultValue={profile?.bio ?? ""} /></label>
      {state.error && <p className="alert-danger font-semibold" role="alert">{state.error}</p>}
      {state.saved && <p className="alert-success" role="status">Profile saved.</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn-primary w-fit">{pending ? "Saving…" : "Save profile"}</button>
        {profile && <Link href={`/u/${profile.handle}`} className="back-link w-fit">View your public profile →</Link>}
      </div>
    </form>
  );
}
