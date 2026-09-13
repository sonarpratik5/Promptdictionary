import type { PromptVariable } from "./types";

const tokenPattern = /{{([a-z][a-z0-9_]*)}}/g;

export type RenderedTemplate = {
  text: string;
  missingRequired: string[];
};

/** Replaces only declared lowercase snake_case tokens; unknown tokens remain literal. */
export function renderTemplate(
  template: string,
  variables: PromptVariable[],
  values: Record<string, string>,
): RenderedTemplate {
  const definitions = new Map(variables.map((variable) => [variable.name, variable]));
  const missingRequired = new Set<string>();

  const text = template.replace(tokenPattern, (token, name: string) => {
    const definition = definitions.get(name);
    if (!definition) return token;
    const suppliedValue = values[name];
    if (suppliedValue?.trim()) return suppliedValue;
    if (definition.defaultValue) return definition.defaultValue;
    if (definition.required) missingRequired.add(name);
    return token;
  });

  return { text, missingRequired: [...missingRequired] };
}
