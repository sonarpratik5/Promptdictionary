import { describe, expect, it } from "vitest";
import { getPromptBySlug, listPromptSlugs, listPrompts, listTags, listUseCases } from "./queries";

describe("prompt queries", () => {
  it("combines search and use-case filters with AND semantics", () => {
    expect(listPrompts({ query: "review", useCase: "Development" }).map((prompt) => prompt.slug)).toEqual([
      "code-review-checklist",
    ]);
    expect(listPrompts({ query: "review", useCase: "Writing" })).toEqual([]);
  });

  it("searches titles, descriptions, use cases, and tags case-insensitively", () => {
    expect(listPrompts({ query: "EDUCATION" }).map((prompt) => prompt.slug)).toEqual([
      "plain-language-explainer",
    ]);
  });

  it("matches a tag case-insensitively and combines it with the other filters", () => {
    expect(listPrompts({ tag: "EDUCATION" }).map((prompt) => prompt.slug)).toEqual([
      "plain-language-explainer",
    ]);
    expect(listPrompts({ query: "review", tag: "education" })).toEqual([]);
  });

  it("returns stable, unique use-case options", () => {
    expect(listUseCases()).toEqual(["Development", "Product management", "Writing"]);
  });

  it("returns stable, unique tag options", () => {
    expect(listTags()).toEqual([
      "code", "editing", "education", "planning", "quality", "research", "review", "strategy", "writing",
    ]);
  });

  it("retrieves a prompt by its stable slug", () => {
    expect(getPromptBySlug("clear-product-brief")?.title).toBe("Clear product brief");
    expect(getPromptBySlug("missing-prompt")).toBeUndefined();
  });

  it("exposes every fixture slug for static route generation", () => {
    expect(listPromptSlugs()).toEqual([
      "clear-product-brief",
      "plain-language-explainer",
      "code-review-checklist",
    ]);
  });
});
