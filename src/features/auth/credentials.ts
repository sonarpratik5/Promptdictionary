import { z } from "zod";

export type AuthMode = "sign-in" | "sign-up";

export type Credentials = {
  email: string;
  password: string;
};

type CredentialFields = {
  email: unknown;
  password: unknown;
};

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.");

const password = z.string().min(1, "Enter your password.");

const schemas = {
  "sign-in": z.object({ email, password }),
  "sign-up": z.object({
    email,
    password: z.string().min(8, "Use a password with at least 8 characters."),
  }),
} as const;

const newPasswordSchema = z.object({
  password: z.string().min(8, "Use a password with at least 8 characters."),
  confirmation: z.string(),
}).refine(({ password, confirmation }) => password === confirmation, {
  path: ["confirmation"],
  message: "Passwords do not match.",
});

/**
 * Validates untrusted form values before they reach Supabase. Keep this
 * boundary reusable for future account mutations rather than trusting client
 * required/minLength attributes.
 */
export function validateCredentials(
  mode: AuthMode,
  fields: CredentialFields,
): { credentials: Credentials } | { error: string } {
  const result = schemas[mode].safeParse(fields);

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Check your credentials and try again." };
  }

  return { credentials: result.data };
}

export function credentialsFromFormData(formData: FormData): CredentialFields {
  return {
    email: formData.get("email"),
    password: formData.get("password"),
  };
}

/** Only preserve an internal, known destination after authentication. */
export function safeAuthRedirect(value: unknown): string {
  return typeof value === "string" && /^\/(?:submit|account|prompts\/[a-z0-9-]+)?$/.test(value) ? value : "/";
}

export function validateEmail(value: unknown): { email: string } | { error: string } {
  const result = email.safeParse(value);
  return result.success ? { email: result.data } : { error: result.error.issues[0]?.message ?? "Enter a valid email address." };
}

export function validateNewPassword(
  password: unknown,
  confirmation: unknown,
): { password: string } | { error: string } {
  const result = newPasswordSchema.safeParse({ password, confirmation });
  return result.success ? { password: result.data.password } : { error: result.error.issues[0]?.message ?? "Check your password and try again." };
}
