import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Comment, CommentKind } from "./types";

type ProfileFields = { handle: string; display_name: string };
type CommentRow = {
  id: string;
  parent_id: string | null;
  author_id: string;
  kind: string;
  body: string;
  created_at: string;
  profiles: ProfileFields | ProfileFields[] | null;
};

function authorFields(row: CommentRow) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return { authorHandle: profile?.handle ?? null, authorDisplayName: profile?.display_name ?? null };
}

/**
 * Threaded one level deep: top-level comments carry their replies. Discussion
 * never modifies the prompt itself (architecture.md, Forum resource contract).
 */
export async function listCommentsForPrompt(promptId: string): Promise<Comment[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("comments")
      .select("id, parent_id, author_id, kind, body, created_at, profiles(handle, display_name)")
      .eq("prompt_id", promptId)
      .eq("status", "visible")
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    const rows = data as unknown as CommentRow[];
    const byId = new Map<string, Comment>();
    for (const row of rows) {
      byId.set(row.id, {
        id: row.id,
        parentId: row.parent_id,
        kind: row.kind as CommentKind,
        body: row.body,
        createdAt: row.created_at,
        isOwn: row.author_id === user?.id,
        replies: [],
        ...authorFields(row),
      });
    }
    const topLevel: Comment[] = [];
    for (const row of rows) {
      const comment = byId.get(row.id)!;
      if (row.parent_id) byId.get(row.parent_id)?.replies.push(comment);
      else topLevel.push(comment);
    }
    return topLevel;
  } catch { return []; }
}
