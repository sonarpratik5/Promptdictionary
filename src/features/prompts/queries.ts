import { prompts } from "./data";
import type { Prompt } from "./types";

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
