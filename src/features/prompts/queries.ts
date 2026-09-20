import { prompts } from "./data";
import type { Prompt } from "./types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PromptFilters = {
  query?: string;
  useCase?: string;
  tag?: string;
};

/**
 * Read-only prompt queries live here so routes do not depend on the storage
 * implementation. This fixture-backed repository can later be replaced by a
 * published-prompt database query without changing the UI contract.
 */
export function listPrompts(filters: PromptFilters = {}): Prompt[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const useCase = filters.useCase?.trim() ?? "";
  const tag = filters.tag?.trim().toLowerCase() ?? "";

  return prompts.filter((prompt) => {
    const searchableText = [
      prompt.title,
      prompt.description,
      prompt.useCase,
      ...prompt.tags,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!query || searchableText.includes(query)) &&
      (!useCase || prompt.useCase === useCase) &&
      (!tag || prompt.tags.some((promptTag) => promptTag.toLowerCase() === tag))
    );
  });
}

/** Returns one prompt through the same read-only query boundary as the library. */
export function getPromptBySlug(slug: string): Prompt | undefined {
  return prompts.find((prompt) => prompt.slug === slug);
}

export function listPromptSlugs(): string[] {
  return prompts.map((prompt) => prompt.slug);
}

export function listUseCases(): string[] {
  return [...new Set(prompts.map((prompt) => prompt.useCase))].sort();
}

export function listTags(): string[] {
  return [...new Set(prompts.flatMap((prompt) => prompt.tags))].sort();
}

export type PromptFacets = {
  useCases: string[];
  tags: string[];
};

function fixtureFacets(): PromptFacets {
  return { useCases: listUseCases(), tags: listTags() };
}

function fromDatabase(row: Record<string, unknown>): Prompt {
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    slug: String(row.slug), title: String(row.title), description: String(row.description), template: String(row.template),
    useCase: String(row.use_case), tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    compatibleModels: Array.isArray(row.compatible_models) ? row.compatible_models.map(String) : [],
    variables: Array.isArray(row.variables) ? row.variables as Prompt["variables"] : [], limitations: String(row.limitations),
    testedAt: typeof row.tested_at === "string" ? row.tested_at : undefined,
    sampleInput: typeof row.sample_input === "string" ? row.sample_input : undefined,
    sampleOutput: typeof row.sample_output === "string" ? row.sample_output : undefined,
  };
}

/** Published database reads are optional until Supabase is configured; fixtures keep local discovery usable. */
export async function listPublishedPrompts(filters: PromptFilters = {}): Promise<Prompt[]> {
  if (!isSupabaseConfigured()) return listPrompts(filters);
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("prompts").select("id, slug, title, description, template, use_case, tags, compatible_models, variables, limitations, tested_at, sample_input, sample_output").eq("status", "published").order("published_at", { ascending: false }).order("id", { ascending: true });
    if (filters.query?.trim()) query = query.textSearch("search_vector", filters.query.trim(), { type: "websearch" });
    if (filters.useCase?.trim()) query = query.eq("use_case", filters.useCase.trim());
    if (filters.tag?.trim()) query = query.contains("tags", [filters.tag.trim()]);
    const { data, error } = await query;
    if (error) return listPrompts(filters);
    return (data ?? []).map((row: Record<string, unknown>) => fromDatabase(row));
  } catch { return listPrompts(filters); }
}

/**
 * Filter choices must come from the same published source as search results.
 * Until Supabase is configured (or if its read fails), fixture choices keep
 * local discovery complete and usable.
 */
export async function listPublishedPromptFacets(): Promise<PromptFacets> {
  if (!isSupabaseConfigured()) return fixtureFacets();
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prompts")
      .select("use_case, tags")
      .eq("status", "published");
    if (error) return fixtureFacets();

    const useCases = new Set<string>();
    const tags = new Set<string>();
    for (const row of data ?? []) {
      if (typeof row.use_case === "string" && row.use_case) useCases.add(row.use_case);
      if (Array.isArray(row.tags)) {
        for (const tag of row.tags) if (typeof tag === "string" && tag) tags.add(tag);
      }
    }
    return { useCases: [...useCases].sort(), tags: [...tags].sort() };
  } catch { return fixtureFacets(); }
}

export async function getPublishedPromptBySlug(slug: string): Promise<Prompt | undefined> {
  if (!isSupabaseConfigured()) return getPromptBySlug(slug);
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("prompts").select("id, slug, title, description, template, use_case, tags, compatible_models, variables, limitations, tested_at, sample_input, sample_output").eq("slug", slug).eq("status", "published").maybeSingle();
    return error || !data ? getPromptBySlug(slug) : fromDatabase(data as Record<string, unknown>);
  } catch { return getPromptBySlug(slug); }
}
