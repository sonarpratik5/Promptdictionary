import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type OwnedPrompt = { id: string; slug: string; title: string; status: string; updatedAt: string; rejectionReason: string | null };
export type SavedPrompt = { id: string; slug: string; title: string; useCase: string };
export type CommunityPromptState =
  | { kind: "unavailable" }
  | { kind: "anonymous" }
  | { kind: "authenticated"; saved: boolean; feedback: boolean | null };

export async function listOwnedPrompts(): Promise<OwnedPrompt[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("prompts").select("id, slug, title, status, updated_at, rejection_reason").eq("owner_id", user.id).order("updated_at", { ascending: false });
  return (data ?? []).map((prompt: { id: string; slug: string; title: string; status: string; updated_at: string; rejection_reason: string | null }) => ({ id: prompt.id, slug: prompt.slug, title: prompt.title, status: prompt.status, updatedAt: prompt.updated_at, rejectionReason: prompt.rejection_reason }));
}

export async function listSavedPrompts(): Promise<SavedPrompt[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("bookmarks").select("prompt_id, prompts!inner(id, slug, title, use_case)").eq("user_id", user.id).eq("prompts.status", "published").order("created_at", { ascending: false });
  return (data ?? []).flatMap((bookmark: { prompt_id: string; prompts: { id: string; slug: string; title: string; use_case: string }[] }) => {
    const prompt = bookmark.prompts[0];
    return prompt ? [{ id: prompt.id || bookmark.prompt_id, slug: prompt.slug, title: prompt.title, useCase: prompt.use_case }] : [];
  });
}

/**
 * Returns only the signed-in viewer's state for a prompt. Database policy is
 * still authoritative; this state exists only to render an honest UI.
 */
export async function getCommunityPromptState(promptId: string): Promise<CommunityPromptState> {
  if (!isSupabaseConfigured()) return { kind: "unavailable" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { kind: "anonymous" };

    const [bookmark, feedback] = await Promise.all([
      supabase.from("bookmarks").select("prompt_id").eq("user_id", user.id).eq("prompt_id", promptId).maybeSingle(),
      supabase.from("prompt_feedback").select("is_helpful").eq("user_id", user.id).eq("prompt_id", promptId).maybeSingle(),
    ]);

    return {
      kind: "authenticated",
      saved: !bookmark.error && Boolean(bookmark.data),
      feedback: feedback.error || !feedback.data ? null : feedback.data.is_helpful,
    };
  } catch {
    return { kind: "unavailable" };
  }
}
