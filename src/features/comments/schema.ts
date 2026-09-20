import { z } from "zod";

const promptIdSchema = z.string().uuid();
const commentIdSchema = z.string().uuid();

export const commentKinds = ["question", "correction", "failure_report", "solution", "general"] as const;

/**
 * Mirrors the `comments` table constraints in
 * `supabase/migrations/20260920120000_profiles_and_comments.sql`; keep both
 * in sync. Reply depth (a reply's target must be a top-level comment) is
 * enforced in the database trigger, not here, since it depends on existing rows.
 */
export const commentSubmissionSchema = z.object({
  promptId: promptIdSchema,
  parentId: commentIdSchema.optional(),
  kind: z.enum(commentKinds),
  body: z.string().trim().min(1, "Write a comment before posting.").max(4000, "Keep comments under 4,000 characters."),
});

export type CommentSubmissionInput = z.infer<typeof commentSubmissionSchema>;

export function validateCommentSubmission(value: unknown): { submission: CommentSubmissionInput } | { error: string } {
  const result = commentSubmissionSchema.safeParse(value);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Check your comment and try again." };
  return { submission: result.data };
}

/** UUIDs arrive in hidden form fields, so validate them before querying. */
export function validateCommentId(value: unknown): string | null {
  const result = commentIdSchema.safeParse(value);
  return result.success ? result.data : null;
}
