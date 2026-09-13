import { describe, expect, it } from "vitest";
import { validateCredentials, validateEmail, validateNewPassword } from "./credentials";

describe("validateCredentials", () => {
  it("trims an email but preserves the supplied password", () => {
    expect(
      validateCredentials("sign-in", {
        email: "  person@example.com  ",
        password: "  intentional whitespace  ",
      }),
    ).toEqual({
      credentials: {
        email: "person@example.com",
        password: "  intentional whitespace  ",
      },
    });
  });

  it("rejects invalid email addresses before contacting Supabase", () => {
    expect(validateCredentials("sign-in", { email: "not-an-email", password: "password" })).toEqual({
      error: "Enter a valid email address.",
    });
  });

  it("enforces the sign-up password minimum on the server", () => {
    expect(validateCredentials("sign-up", { email: "person@example.com", password: "short" })).toEqual({
      error: "Use a password with at least 8 characters.",
    });
  });

  it("does not coerce non-string form values into credentials", () => {
    expect(validateCredentials("sign-in", { email: null, password: null })).toEqual({
      error: "Invalid input: expected string, received null",
    });
  });

  it("validates a reset email without requiring a password", () => {
    expect(validateEmail("  person@example.com ")).toEqual({ email: "person@example.com" });
  });

  it("requires a matching, sufficiently long replacement password", () => {
    expect(validateNewPassword("new-password", "different-password")).toEqual({ error: "Passwords do not match." });
    expect(validateNewPassword("new-password", "new-password")).toEqual({ password: "new-password" });
  });
});
