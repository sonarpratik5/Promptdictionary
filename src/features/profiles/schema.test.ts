import { describe, expect, it } from "vitest";
import { validateProfileUpdate } from "./schema";

const valid = { handle: "ada-lovelace", displayName: "Ada Lovelace", bio: "Prompt engineer." };

describe("validateProfileUpdate", () => {
  it("accepts a well-formed profile and lowercases the handle", () => {
    const result = validateProfileUpdate({ ...valid, handle: "Ada-Lovelace" });
    expect(result).toEqual({ submission: expect.objectContaining({ handle: "ada-lovelace" }) });
  });

  it("accepts an omitted bio", () => {
    const result = validateProfileUpdate({ handle: valid.handle, displayName: valid.displayName });
    expect("submission" in result && result.submission.bio).toBeUndefined();
  });

  it("rejects a handle under 2 characters", () => {
    const result = validateProfileUpdate({ ...valid, handle: "a" });
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("rejects a handle starting with a hyphen", () => {
    const result = validateProfileUpdate({ ...valid, handle: "-ada" });
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("rejects a handle with disallowed characters", () => {
    const result = validateProfileUpdate({ ...valid, handle: "ada lovelace" });
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("rejects an empty display name", () => {
    const result = validateProfileUpdate({ ...valid, displayName: "" });
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("rejects a bio over 500 characters", () => {
    const result = validateProfileUpdate({ ...valid, bio: "x".repeat(501) });
    expect(result).toEqual({ error: "Keep the bio under 500 characters." });
  });
});
