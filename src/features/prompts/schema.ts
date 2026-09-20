import { z } from "zod";

const variableNamePattern = /^[a-z][a-z0-9_]*$/;
const promptIdSchema = z.string().uuid();

/**
 * Mirrors the `{{name}}` token contract in `template.ts` so a declared
 * variable can never be unrenderable after submission.
 */
export const promptVariableSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the variable a name.")
    .regex(variableNamePattern, "Use lowercase snake_case, e.g. product_name."),
  label: z.string().trim().min(1, "Give the variable a label."),
  description: z.string().trim().min(1, "Describe what the variable is for."),
  defaultValue: z.string().trim().max(2000, "Keep the default value under 2,000 characters.").optional(),
  required: z.boolean().optional(),
});

const sampleField = z
  .string()
  .trim()
  .min(1)
  .max(2000, "Keep sample text under 2,000 characters.");

/**
 * Untrusted contribution input, validated before it reaches the database.
 * Field limits and required-ness match the `prompts` table constraints in
 * `supabase/migrations/20260912200000_prompts_schema.sql`; keep both in sync.
 */
export const promptSubmissionSchema = z
  .object({
    title: z.string().trim().min(1, "Give the prompt a title.").max(120, "Keep the title under 120 characters."),
    description: z
      .string()
      .trim()
      .min(1, "Describe what the prompt does.")
      .max(500, "Keep the description under 500 characters."),
    template: z.string().trim().min(1, "The prompt template cannot be empty.").max(8000, "Keep the template under 8,000 characters."),
    useCase: z.string().trim().min(1, "Choose or enter a use case.").max(60, "Keep the use case under 60 characters."),
    tags: z.array(z.string().trim().min(1)).min(1, "Add at least one tag."),
    compatibleModels: z.array(z.string().trim().min(1)).min(1, "List at least one compatible model."),
    variables: z.array(promptVariableSchema).default([]),
    limitations: z.string().trim().min(1, "State the prompt's known limitations.").max(500, "Keep limitations under 500 characters."),
    testedAt: z.string().date("Use a YYYY-MM-DD date.").optional(),
    sampleInput: sampleField.optional(),
    sampleOutput: sampleField.optional(),
  })
  .refine((value) => Boolean(value.sampleInput) === Boolean(value.sampleOutput), {
    message: "Provide both a sample input and output, or neither.",
    path: ["sampleOutput"],
  })
  .refine(
    (value) => {
      const names = value.variables.map((variable) => variable.name);
      return new Set(names).size === names.length;
    },
    { message: "Variable names must be unique.", path: ["variables"] },
  )
  .refine(
    (value) =>
      value.variables.every((variable) => value.template.includes(`{{${variable.name}}}`)),
    {
      message: "Each editable detail must appear in the template as its {{token_name}}.",
      path: ["variables"],
    },
  );

export type PromptSubmissionInput = z.infer<typeof promptSubmissionSchema>;

export function validatePromptSubmission(
  value: unknown,
): { submission: PromptSubmissionInput } | { error: string } {
  const result = promptSubmissionSchema.safeParse(value);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Check the prompt details and try again." };
  }
  return { submission: result.data };
}

/** UUIDs arrive in hidden form fields, so validate them before querying. */
export function validatePromptId(value: unknown): string | null {
  const result = promptIdSchema.safeParse(value);
  return result.success ? result.data : null;
}
