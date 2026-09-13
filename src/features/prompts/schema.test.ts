import { describe, expect, it } from "vitest";
import { validatePromptSubmission } from "./schema";

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
