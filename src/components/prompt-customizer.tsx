"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildShareQuery, buildShareUrl, parseSharedValues } from "@/features/prompts/share";
import { renderTemplate } from "@/features/prompts/template";
import type { Prompt } from "@/features/prompts/types";

type CopyState = "idle" | "copied" | "error";

export function PromptCustomizer({ prompt }: { prompt: Prompt }) {
  const searchParams = useSearchParams();
  // `null` means "untouched": the values shown are still the ones the shared
  // link supplied. The first edit takes ownership of the whole set.
  const [edits, setEdits] = useState<Record<string, string> | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [shareState, setShareState] = useState<CopyState>("idle");
  const [shareUrl, setShareUrl] = useState("");
  // Shared values are derived from the URL rather than copied into state, so
  // there is no mount-time state write and no second render to reconcile.
  const shared = useMemo(
    () => parseSharedValues(searchParams, prompt.variables),
    [searchParams, prompt.variables],
  );
  const values = edits ?? shared;
  const rendered = renderTemplate(prompt.template, prompt.variables, values);

  // Keeps the address bar shareable without a navigation per keystroke.
  useEffect(() => {
    const query = buildShareQuery(prompt.variables, values);
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [prompt.variables, values]);

  function update(name: string, value: string) {
    setEdits((current) => ({ ...(current ?? shared), [name]: value }));
    setCopyState("idle");
    setShareState("idle");
    setShareUrl("");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(rendered.text);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function copyShareLink() {
    const url = buildShareUrl(window.location.href, prompt.variables, values);
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch {
      setShareState("error");
    }
  }

  const adaptedCount = prompt.variables.filter((variable) => values[variable.name]?.trim()).length;

  return (
    <section aria-labelledby="adapt-heading" className="grid overflow-hidden rounded-2xl border border-border bg-surface lg:grid-cols-[.85fr_1.15fr]">
      <div className="min-w-0 border-b border-border p-6 lg:border-b-0 lg:border-r lg:p-8">
        <p className="eyebrow">01 · Personalize</p>
        <h2 id="adapt-heading" className="mt-2 text-2xl font-semibold tracking-tight">Add your context</h2>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">Your changes update the preview. The original prompt stays the same.</p>
        <div className="mt-7 grid gap-5">
          {prompt.variables.map((variable) => <div key={variable.name} className="grid gap-2">
            <label className="flex flex-wrap items-baseline justify-between gap-2 text-sm font-semibold" htmlFor={variable.name}>{variable.label}<span className="text-xs font-normal text-foreground-muted">{variable.required ? "Required" : "Optional"}</span></label>
            <p id={`${variable.name}-hint`} className="text-sm leading-5 text-foreground-muted">{variable.description}{variable.defaultValue && ` Leave blank to use “${variable.defaultValue}”.`}</p>
            <textarea id={variable.name} rows={variable.name === "context" || variable.name === "problem" ? 4 : 2} maxLength={2000} aria-required={variable.required || undefined} aria-describedby={`${variable.name}-hint`} value={values[variable.name] ?? ""} placeholder={variable.defaultValue ?? `Enter ${variable.label.toLowerCase()}…`} onChange={(event) => update(variable.name, event.target.value)} className="field font-normal" />
          </div>)}
        </div>
        <p className="mt-6 text-sm leading-6 text-foreground-muted">Values appear in the page address and shared links. Only include information you intend to share. Each field accepts up to 2,000 characters.</p>
      </div>
      <div className="preview-panel min-w-0 p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="eyebrow text-accent-on-dark">02 · Preview & copy</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Your adapted prompt</h2></div>
          <span className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/80">{rendered.missingRequired.length ? `${rendered.missingRequired.length} required remaining` : "Ready to copy"}</span>
        </div>
        <pre tabIndex={0} aria-label="Adapted prompt preview" className="mt-6 min-h-72 whitespace-pre-wrap rounded-xl border border-white/20 bg-black/15 p-5 font-mono text-sm leading-7 text-white/90">{rendered.text}</pre>
        {rendered.missingRequired.length > 0 && <p className="mt-4 text-sm leading-6 text-white/80">Before copying, fill in: {prompt.variables.filter((variable) => rendered.missingRequired.includes(variable.name)).map((variable) => variable.label).join(", ")}.</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={copy} disabled={rendered.missingRequired.length > 0} className="min-h-11 rounded-xl bg-accent-on-dark px-5 py-3 text-sm font-semibold text-[var(--code-background)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{copyState === "copied" ? "Copied ✓" : "Copy adapted prompt"}</button>
          <button type="button" onClick={copyShareLink} disabled={adaptedCount === 0} className="min-h-11 rounded-xl border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40">{shareState === "copied" ? "Link copied ✓" : "Copy share link"}</button>
        </div>
        <p className="mt-4 min-h-12 text-sm leading-6 text-white/80" role="status">{copyState === "copied" ? "Copied to your clipboard. Paste it into your AI tool to get started." : copyState === "error" ? "Couldn’t copy automatically. Select the preview and copy it manually." : shareState === "copied" ? "Share link copied — it opens this prompt with your values filled in." : shareState === "error" ? "Couldn’t copy the link automatically. Copy it from the field below." : adaptedCount === 0 ? "Fill in a value to create a share link." : "Your preview updates as you type."}</p>
        {shareState === "error" && shareUrl && <input readOnly value={shareUrl} aria-label="Shareable link" onFocus={(event) => event.currentTarget.select()} className="mt-3 w-full rounded-xl border border-white/30 bg-black/20 px-4 py-3 font-mono text-sm text-white" />}
      </div>
    </section>
  );
}
