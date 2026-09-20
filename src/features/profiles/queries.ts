import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "./types";

type ProfileRow = { user_id: string; handle: string; display_name: string; bio: string | null };

function fromRow(row: ProfileRow): Profile {
  return { userId: row.user_id, handle: row.handle, displayName: row.display_name, bio: row.bio };
}

/** The signed-in viewer's own profile, for editing. Never another viewer's data. */
export async function getOwnProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from("profiles").select("user_id, handle, display_name, bio").eq("user_id", user.id).maybeSingle();
    return error || !data ? null : fromRow(data as ProfileRow);
  } catch { return null; }
}

/** Profiles are public by product design; any viewer, signed in or not, can read one by handle. */
export async function getPublicProfile(handle: string): Promise<Profile | null> {
  if (!isSupabaseConfigured() || !handle) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("profiles").select("user_id, handle, display_name, bio").eq("handle", handle).maybeSingle();
    return error || !data ? null : fromRow(data as ProfileRow);
  } catch { return null; }
}

export type PublishedProfilePrompt = { id: string; slug: string; title: string; useCase: string };

/** Published prompts authored by one profile, for its public page. */
export async function listPublishedPromptsByOwner(userId: string): Promise<PublishedProfilePrompt[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("prompts").select("id, slug, title, use_case").eq("owner_id", userId).eq("status", "published").order("published_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row: { id: string; slug: string; title: string; use_case: string }) => ({ id: row.id, slug: row.slug, title: row.title, useCase: row.use_case }));
  } catch { return []; }
}
