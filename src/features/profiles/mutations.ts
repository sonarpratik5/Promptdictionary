"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validateProfileUpdate } from "./schema";

export type ProfileMutationState = { error?: string; saved?: boolean };

const UNIQUE_VIOLATION = "23505";

export async function updateProfile(_: ProfileMutationState, formData: FormData): Promise<ProfileMutationState> {
  if (!isSupabaseConfigured()) return { error: "Profiles are not available until the library is connected." };
  const validation = validateProfileUpdate({
    handle: formData.get("handle"),
    displayName: formData.get("displayName"),
    bio: String(formData.get("bio") || "") || undefined,
  });
  if ("error" in validation) return validation;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to edit your profile." };
  const { submission } = validation;
  const { error } = await supabase.from("profiles").upsert({ user_id: user.id, handle: submission.handle, display_name: submission.displayName, bio: submission.bio ?? null });
  if (error) {
    if ((error as { code?: string }).code === UNIQUE_VIOLATION) return { error: "That handle is already taken." };
    return { error: "We couldn’t save your profile." };
  }
  revalidatePath("/account");
  revalidatePath(`/u/${submission.handle}`);
  return { saved: true };
}
