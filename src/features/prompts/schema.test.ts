import { describe, expect, it } from "vitest";
import { validatePromptId, validatePromptSubmission } from "./schema";

const validSubmission = {
  title: "Clear product brief",
  description: "Turn rough context into a concise, decision-ready brief.",
  template: "Draft a brief for {{product_name}}.",
  useCase: "Product management",
  tags: ["strategy"],
  compatibleModels: ["Claude"],
  variables: [{ name: "product_name", label: "Product name", description: "The product to brief.", required: true }],
  limitations: "Does not replace customer research.",
};

describe("validatePromptSubmission", () => {
  it("accepts a well-formed submission", () => {
    const result = validatePromptSubmission(validSubmission);
    expect(result).toEqual({ submission: expect.objectContaining({ title: validSubmission.title }) });
  });

  it("requires a title", () => {
    const result = validatePromptSubmission({ ...validSubmission, title: "" });
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("requires at least one tag", () => {
    const result = validatePromptSubmission({ ...validSubmission, tags: [] });
    expect(result).toEqual({ error: "Add at least one tag." });
  });

  it("requires at least one compatible model", () => {
    const result = validatePromptSubmission({ ...validSubmission, compatibleModels: [] });
    expect(result).toEqual({ error: "List at least one compatible model." });
  });

  it("rejects a variable name that is not lowercase snake_case", () => {
    const result = validatePromptSubmission({
      ...validSubmission,
      variables: [{ name: "ProductName", label: "Product name", description: "x" }],
    });
    expect(result).toEqual({ error: expect.stringContaining("snake_case") });
  });

  it("rejects duplicate variable names", () => {
    const result = validatePromptSubmission({
      ...validSubmission,
      variables: [
        { name: "product_name", label: "A", description: "a" },
        { name: "product_name", label: "B", description: "b" },
      ],
    });
    expect(result).toEqual({ error: "Variable names must be unique." });
  });

  it("rejects an editable detail that cannot be substituted into the template", () => {
    const result = validatePromptSubmission({
      ...validSubmission,
      variables: [{ name: "audience", label: "Audience", description: "Who the brief is for." }],
    });
    expect(result).toEqual({ error: "Each editable detail must appear in the template as its {{token_name}}." });
  });

  it("requires a sample input and output together, not just one", () => {
    const result = validatePromptSubmission({ ...validSubmission, sampleInput: "example input" });
    expect(result).toEqual({ error: "Provide both a sample input and output, or neither." });
  });

  it("accepts a submission with neither sample field", () => {
    const result = validatePromptSubmission(validSubmission);
    expect("error" in result).toBe(false);
  });

  it("accepts a submission with both sample fields", () => {
    const result = validatePromptSubmission({
      ...validSubmission,
      sampleInput: "example input",
      sampleOutput: "example output",
    });
    expect("error" in result).toBe(false);
  });

  it("rejects a malformed tested-at date", () => {
    const result = validatePromptSubmission({ ...validSubmission, testedAt: "09/12/2026" });
    expect(result).toEqual({ error: expect.any(String) });
  });
});

describe("validatePromptId", () => {
  it("accepts UUID hidden-field values and rejects arbitrary identifiers", () => {
    expect(validatePromptId("02d7e41f-944b-482f-86c2-3f29fb4f76f4")).toBe("02d7e41f-944b-482f-86c2-3f29fb4f76f4");
    expect(validatePromptId("not-a-prompt-id")).toBeNull();
    expect(validatePromptId(null)).toBeNull();
  });
});
