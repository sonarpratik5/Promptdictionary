import { z } from "zod";

const handlePattern = /^[a-z0-9][a-z0-9_-]{1,29}$/;

/**
 * Mirrors the `profiles.handle` check constraint in
 * `supabase/migrations/20260920120000_profiles_and_comments.sql`; keep both
 * in sync.
 */
export const profileUpdateSchema = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Handle must be at least 2 characters.")
    .max(30, "Keep the handle under 30 characters.")
    .regex(handlePattern, "Use lowercase letters, numbers, hyphens, or underscores, starting with a letter or number."),
  displayName: z.string().trim().min(1, "Give yourself a display name.").max(60, "Keep the display name under 60 characters."),
  bio: z.string().trim().max(500, "Keep the bio under 500 characters.").optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export function validateProfileUpdate(value: unknown): { submission: ProfileUpdateInput } | { error: string } {
  const result = profileUpdateSchema.safeParse(value);
  if (!result.success) return { error: result.error.issues[0]?.message ?? "Check your profile details and try again." };
  return { submission: result.data };
}
