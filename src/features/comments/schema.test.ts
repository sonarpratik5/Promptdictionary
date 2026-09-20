import { describe, expect, it } from "vitest";
import { validateCommentId, validateCommentSubmission } from "./schema";

const promptId = "02d7e41f-944b-482f-86c2-3f29fb4f76f4";
const commentId = "b6e0e4b0-3e0a-4b9a-9c2a-8f9a5a2e5a11";

describe("validateCommentSubmission", () => {
  it("accepts a well-formed top-level comment", () => {
    const result = validateCommentSubmission({ promptId, kind: "question", body: "Does this work with GPT-5?" });
    expect(result).toEqual({ submission: expect.objectContaining({ promptId, kind: "question" }) });
  });

  it("accepts a well-formed reply with a parentId", () => {
    const result = validateCommentSubmission({ promptId, parentId: commentId, kind: "general", body: "Yes, works great." });
    expect(result).toEqual({ submission: expect.objectContaining({ parentId: commentId }) });
  });

  it("rejects a malformed promptId", () => {
    const result = validateCommentSubmission({ promptId: "not-a-uuid", kind: "question", body: "x" });
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("rejects an unknown kind", () => {
    const result = validateCommentSubmission({ promptId, kind: "spam", body: "x" });
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("rejects an empty body", () => {
    const result = validateCommentSubmission({ promptId, kind: "question", body: "   " });
    expect(result).toEqual({ error: "Write a comment before posting." });
  });

  it("rejects a body over 4,000 characters", () => {
    const result = validateCommentSubmission({ promptId, kind: "question", body: "x".repeat(4001) });
    expect(result).toEqual({ error: "Keep comments under 4,000 characters." });
  });
});

describe("validateCommentId", () => {
  it("accepts a valid UUID", () => {
    expect(validateCommentId(commentId)).toBe(commentId);
  });

  it("rejects a tampered id", () => {
    expect(validateCommentId("../../etc/passwd")).toBeNull();
  });

  it("rejects a missing id", () => {
    expect(validateCommentId(null)).toBeNull();
  });
});
