"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validateCommentId, validateCommentSubmission } from "./schema";

export type CommentMutationState = { error?: string; posted?: boolean; deleted?: boolean; reported?: boolean };

async function currentUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

function slugFromForm(formData: FormData) {
  return String(formData.get("promptSlug") || "");
}

export async function postComment(_: CommentMutationState, formData: FormData): Promise<CommentMutationState> {
  if (!isSupabaseConfigured()) return { error: "Discussion is not available until the library is connected." };
  const validation = validateCommentSubmission({
    promptId: formData.get("promptId"),
    parentId: String(formData.get("parentId") || "") || undefined,
    kind: formData.get("kind"),
    body: formData.get("body"),
  });
  if ("error" in validation) return validation;
  const session = await currentUser();
  if (!session) return { error: "Sign in to join the discussion." };
  const { submission } = validation;
  const { error } = await session.supabase.from("comments").insert({
    prompt_id: submission.promptId,
    parent_id: submission.parentId ?? null,
    author_id: session.user.id,
    kind: submission.kind,
    body: submission.body,
  });
  if (error) return { error: "We couldn’t post that comment." };
  const slug = slugFromForm(formData);
  if (slug) revalidatePath(`/prompts/${slug}`);
  return { posted: true };
}

export async function deleteComment(_: CommentMutationState, formData: FormData): Promise<CommentMutationState> {
  const id = validateCommentId(formData.get("commentId"));
  const session = await currentUser();
  if (!session || !id) return { error: "Sign in to manage your comments." };
  const { error } = await session.supabase.from("comments").delete().eq("id", id).eq("author_id", session.user.id);
  if (error) return { error: "We couldn’t delete that comment." };
  const slug = slugFromForm(formData);
  if (slug) revalidatePath(`/prompts/${slug}`);
  return { deleted: true };
}

export async function reportComment(_: CommentMutationState, formData: FormData): Promise<CommentMutationState> {
  const id = validateCommentId(formData.get("commentId"));
  const reason = String(formData.get("reason") || "").trim();
  const session = await currentUser();
  if (!session || !id) return { error: "Sign in to report a comment." };
  if (!reason || reason.length > 500) return { error: "Tell us what needs attention in 500 characters or fewer." };
  const { error } = await session.supabase.from("reports").insert({ reporter_id: session.user.id, comment_id: id, reason });
  if (error) return { error: "We couldn’t send that report." };
  return { reported: true };
}
