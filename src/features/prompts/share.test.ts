import { describe, expect, it } from "vitest";
import {
  buildShareQuery,
  buildShareUrl,
  maxSharedValueLength,
  parseSharedValues,
} from "./share";
import type { PromptVariable } from "./types";

const variables: PromptVariable[] = [
  { name: "audience", label: "Audience", description: "", required: true },
  { name: "topic", label: "Topic", description: "", defaultValue: "onboarding" },
];

describe("parseSharedValues", () => {
  it("keeps only declared variables", () => {
    const source = new URLSearchParams({ "v.audience": "new hires", "v.injected": "x", q: "y" });
    expect(parseSharedValues(source, variables)).toEqual({ audience: "new hires" });
  });

  it("drops blank and over-long values", () => {
    const source = new URLSearchParams({
      "v.audience": "   ",
      "v.topic": "t".repeat(maxSharedValueLength + 1),
    });
    expect(parseSharedValues(source, variables)).toEqual({});
  });

  it("reads a resolved searchParams object and its first repeated value", () => {
    const source = { "v.audience": ["first", "second"], "v.topic": "docs" };
    expect(parseSharedValues(source, variables)).toEqual({ audience: "first", topic: "docs" });
  });

  it("preserves surrounding text of a supplied value", () => {
    const source = new URLSearchParams({ "v.audience": " new hires " });
    expect(parseSharedValues(source, variables).audience).toBe(" new hires ");
  });
});

describe("buildShareQuery", () => {
  it("serializes supplied values in declaration order", () => {
    expect(buildShareQuery(variables, { topic: "docs", audience: "new hires" })).toBe(
      "v.audience=new+hires&v.topic=docs",
    );
  });

  it("omits blank, unknown, and over-long values", () => {
    const query = buildShareQuery(variables, {
      audience: "",
      topic: "t".repeat(maxSharedValueLength + 1),
      unknown: "x",
    });
    expect(query).toBe("");
  });

  it("round-trips through parseSharedValues", () => {
    const values = { audience: "staff engineers", topic: "code review" };
    expect(parseSharedValues(new URLSearchParams(buildShareQuery(variables, values)), variables)).toEqual(values);
  });
});

describe("buildShareUrl", () => {
  it("replaces any existing query string", () => {
    expect(buildShareUrl("https://example.test/prompts/a?v.audience=old", variables, { audience: "new" })).toBe(
      "https://example.test/prompts/a?v.audience=new",
    );
  });

  it("returns the bare path when nothing is adapted", () => {
    expect(buildShareUrl("https://example.test/prompts/a?v.audience=old", variables, {})).toBe(
      "https://example.test/prompts/a",
    );
  });
});
