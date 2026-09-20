"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validatePromptId, validatePromptSubmission } from "./schema";

export type PromptMutationState = { error?: string; saved?: boolean; feedback?: boolean; reported?: boolean };

function promptIdFromForm(formData: FormData) {
  return validatePromptId(formData.get("promptId"));
}

async function currentUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

function slugify(title: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
  return `${base || "prompt"}-${crypto.randomUUID().slice(0, 8)}`;
}

function listField(formData: FormData, name: string) {
  return formData.getAll(name).flatMap((value) => String(value).split(/[\n,]/)).map((value) => value.trim()).filter(Boolean);
}

function variablesFromForm(formData: FormData) {
  const names = formData.getAll("variableName");
  return names.map((name, index) => ({
    name: String(name),
    label: String(formData.getAll("variableLabel")[index] ?? ""),
    description: String(formData.getAll("variableDescription")[index] ?? ""),
    defaultValue: String(formData.getAll("variableDefault")[index] ?? ""),
    required: formData.getAll("variableRequired").includes(String(index)),
  }));
}

export async function createPrompt(_: PromptMutationState, formData: FormData): Promise<PromptMutationState> {
  if (!isSupabaseConfigured()) return { error: "Contributions are not available until the library is connected." };
  const validation = validatePromptSubmission({
    title: formData.get("title"), description: formData.get("description"), template: formData.get("template"), useCase: formData.get("useCase"),
    tags: listField(formData, "tags"), compatibleModels: listField(formData, "compatibleModels"), variables: variablesFromForm(formData), limitations: formData.get("limitations"),
    testedAt: String(formData.get("testedAt") || "") || undefined, sampleInput: String(formData.get("sampleInput") || "") || undefined, sampleOutput: String(formData.get("sampleOutput") || "") || undefined,
  });
  if ("error" in validation) return validation;
  try {
    const session = await currentUser();
    if (!session) return { error: "Sign in to share a prompt with the community." };
    const { supabase, user } = session;
    const submission = validation.submission;
    const { data: draft, error: insertError } = await supabase.from("prompts").insert({
      owner_id: user.id, slug: slugify(submission.title), title: submission.title, description: submission.description, template: submission.template,
      use_case: submission.useCase, tags: submission.tags, compatible_models: submission.compatibleModels, variables: submission.variables,
      limitations: submission.limitations, tested_at: submission.testedAt ?? null, sample_input: submission.sampleInput ?? null, sample_output: submission.sampleOutput ?? null, status: "draft",
    }).select("id").single();
    if (insertError || !draft) return { error: insertError?.message ?? "We couldn’t save that prompt." };
    const { error: submitError } = await supabase.from("prompts").update({ status: "pending" }).eq("id", draft.id).eq("owner_id", user.id);
    if (submitError) return { error: "Your prompt was saved, but could not be sent for review. Open your account to try again." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn’t submit that prompt." };
  }
  redirect("/submit?submitted=1");
}

export async function resubmitPrompt(_: PromptMutationState, formData: FormData): Promise<PromptMutationState> {
  const id = promptIdFromForm(formData);
  const session = await currentUser();
  if (!session || !id) return { error: "Sign in to manage your prompts." };
  const { error } = await session.supabase.from("prompts").update({ status: "pending", rejection_reason: null }).eq("id", id).eq("owner_id", session.user.id).in("status", ["draft", "rejected"]);
  if (error) return { error: "We couldn’t send that prompt for review." };
  redirect("/account?updated=1");
}

export async function deletePrompt(_: PromptMutationState, formData: FormData): Promise<PromptMutationState> {
  const id = promptIdFromForm(formData);
  const session = await currentUser();
  if (!session || !id) return { error: "Sign in to manage your prompts." };
  const { error } = await session.supabase.from("prompts").delete().eq("id", id).eq("owner_id", session.user.id).in("status", ["draft", "rejected"]);
  if (error) return { error: "We couldn’t delete that draft." };
  redirect("/account?updated=1");
}

export async function toggleBookmark(_: PromptMutationState, formData: FormData): Promise<PromptMutationState> {
  const promptId = promptIdFromForm(formData);
  const session = await currentUser();
  if (!session || !promptId) return { error: "Sign in to save prompts." };
  const shouldSave = formData.get("saved") === "true";
  const result = shouldSave
    ? await session.supabase.from("bookmarks").upsert({ user_id: session.user.id, prompt_id: promptId })
    : await session.supabase.from("bookmarks").delete().eq("user_id", session.user.id).eq("prompt_id", promptId);
  if (result.error) return { error: "We couldn’t update your saved prompts." };
  return { saved: shouldSave };
}

export async function submitFeedback(_: PromptMutationState, formData: FormData): Promise<PromptMutationState> {
  const promptId = promptIdFromForm(formData);
  const session = await currentUser();
  if (!session || !promptId) return { error: "Sign in to leave feedback." };
  const isHelpful = formData.get("isHelpful") === "true";
  const { error } = await session.supabase.from("prompt_feedback").upsert({ user_id: session.user.id, prompt_id: promptId, is_helpful: isHelpful });
  if (error) return { error: "We couldn’t save your feedback." };
  return { feedback: isHelpful };
}

export async function reportPrompt(_: PromptMutationState, formData: FormData): Promise<PromptMutationState> {
  const promptId = promptIdFromForm(formData);
  const reason = String(formData.get("reason") || "").trim();
  const session = await currentUser();
  if (!session || !promptId) return { error: "Sign in to report a prompt." };
  if (!reason || reason.length > 500) return { error: "Tell us what needs attention in 500 characters or fewer." };
  const { error } = await session.supabase.from("reports").insert({ reporter_id: session.user.id, prompt_id: promptId, reason });
  if (error) return { error: "We couldn’t send that report." };
  return { reported: true };
}
