import type { PromptVariable } from "./types";

/** Query-parameter prefix for a shared adaptation value: `?v.audience=...`. */
export const shareParamPrefix = "v.";

/**
 * Upper bound for one shared value. Shared links are untrusted input, so an
 * oversized value is rejected rather than truncated: a silently shortened
 * prompt would misrepresent what the sender shared.
 */
export const maxSharedValueLength = 2000;

export type SharedValues = Record<string, string>;

/** A URL-ish source of query values (`URLSearchParams` or Next's resolved `searchParams`). */
export type ShareQuerySource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function readParam(source: ShareQuerySource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Accepts only values for variables this prompt declares. Unknown parameters,
 * blank values, and over-long values are dropped, so a shared link can never
 * introduce a variable, and its content is still only ever rendered as text.
 */
export function parseSharedValues(
  source: ShareQuerySource,
  variables: PromptVariable[],
): SharedValues {
  const values: SharedValues = {};
  for (const variable of variables) {
    const raw = readParam(source, `${shareParamPrefix}${variable.name}`);
    if (typeof raw !== "string") continue;
    if (!raw.trim() || raw.length > maxSharedValueLength) continue;
    values[variable.name] = raw;
  }
  return values;
}

/**
 * Serializes the adaptation values that actually change the output. Blank and
 * over-long values are omitted so a shared link stays as short as the edits.
 */
export function buildShareQuery(
  variables: PromptVariable[],
  values: SharedValues,
): string {
  const params = new URLSearchParams();
  for (const variable of variables) {
    const value = values[variable.name];
    if (!value?.trim() || value.length > maxSharedValueLength) continue;
    params.set(`${shareParamPrefix}${variable.name}`, value);
  }
  return params.toString();
}

/** Builds an absolute shareable URL for a prompt page plus its adaptation values. */
export function buildShareUrl(
  baseUrl: string,
  variables: PromptVariable[],
  values: SharedValues,
): string {
  const query = buildShareQuery(variables, values);
  const [path] = baseUrl.split("?");
  return query ? `${path}?${query}` : path;
}
