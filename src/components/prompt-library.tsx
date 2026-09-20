"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { Prompt } from "@/features/prompts/types";

type Props = { prompts: Prompt[]; query: string; useCase: string; tag: string; useCases: string[]; tags: string[] };

function SearchInput({ initialValue, onSearch }: { initialValue: string; onSearch: (value: string) => void }) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousInitialValue = useRef(initialValue);

  useEffect(() => {
    setValue((currentValue) => currentValue === previousInitialValue.current ? initialValue : currentValue);
    previousInitialValue.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    if (value === initialValue) return;
    const timeout = window.setTimeout(() => onSearch(value), 250);
    return () => window.clearTimeout(timeout);
  }, [value, initialValue, onSearch]);

  function clear() {
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} type="search" autoComplete="off" id="prompt-search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Try ‘brief’ or ‘code review’" className="w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-foreground-muted" />
      {value && <button type="button" onClick={clear} className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-foreground-muted hover:bg-background-secondary hover:text-foreground" aria-label="Clear search">Clear</button>}
    </>
  );
}

export function PromptLibrary({ prompts, query, useCase, tag, useCases, tags }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const update = useCallback((filters: { q?: string; useCase?: string; tag?: string }, options?: { push?: boolean }) => {
    const params = new URLSearchParams();
    const nextQuery = filters.q ?? query;
    const nextUseCase = filters.useCase ?? useCase;
    const nextTag = filters.tag ?? tag;
    if (nextQuery) params.set("q", nextQuery);
    if (nextUseCase) params.set("useCase", nextUseCase);
    if (nextTag) params.set("tag", nextTag);
    const suffix = params.size ? `?${params.toString()}` : "";
    // Discrete filter actions (chip/select/clear) push a history entry so the
    // browser back/forward buttons step through them; the debounced search
    // box replaces instead so every keystroke pause doesn't add an entry.
    const navigate = options?.push ? router.push : router.replace;
    startTransition(() => navigate(`/${suffix}`, { scroll: false }));
  }, [query, router, tag, useCase]);
  const searchPrompts = useCallback((value: string) => update({ q: value }), [update]);

  const hasActiveFilters = Boolean(query || useCase || tag);

  return (
    <section id="explore" aria-labelledby="library-heading" className="mx-auto max-w-6xl px-5 pb-10">
      <div className="card grid gap-3 p-3 shadow-sm md:grid-cols-[1fr_13rem]">
        <label className="flex min-h-16 items-center gap-3 rounded-xl border border-border-strong bg-surface px-4 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15" htmlFor="prompt-search">
          <svg aria-hidden="true" className="size-5 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          <span className="sr-only">Search prompts</span>
          <SearchInput initialValue={query} onSearch={searchPrompts} />
        </label>
        <label className="grid gap-1 rounded-xl bg-background-secondary px-4 py-2 text-sm font-medium" htmlFor="tag">
          <span className="text-xs text-foreground-muted">Filter by topic</span>
          <select id="tag" value={tag} onChange={(event) => update({ tag: event.target.value }, { push: true })} className="w-full min-w-0 bg-transparent py-1 text-base text-foreground">
            <option value="">All topics</option>
            {tag && !tags.includes(tag) && <option value={tag}>{tag}</option>}
            {tags.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by use case">
        <button type="button" className="filter-chip" aria-pressed={!useCase} onClick={() => update({ useCase: "" }, { push: true })}>All use cases</button>
        {useCases.map((option) => <button type="button" key={option} className="filter-chip" aria-pressed={useCase === option} onClick={() => update({ useCase: option }, { push: true })}>{option}</button>)}
      </div>
      <div className="mb-5 mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 id="library-heading" className="text-xl font-semibold tracking-tight">{hasActiveFilters ? "Search results" : "Explore prompts"}</h2>
          <p className="text-sm text-foreground-muted" role="status" aria-live="polite" aria-atomic="true" aria-busy={isPending}>
            {isPending ? "Updating results…" : `${prompts.length} ${prompts.length === 1 ? "prompt" : "prompts"}`}
          </p>
        </div>
        {hasActiveFilters && <button type="button" onClick={() => update({ q: "", useCase: "", tag: "" }, { push: true })} className="btn-quiet text-accent">Clear all filters ×</button>}
      </div>
      {hasActiveFilters && <div className="mb-5 flex flex-wrap gap-2" aria-label="Active filters">
        {[query && { label: `Search: ${query}`, clear: { q: "" } }, useCase && { label: `Use case: ${useCase}`, clear: { useCase: "" } }, tag && { label: `Topic: ${tag}`, clear: { tag: "" } }].filter((item) => !!item).map((item) => <button type="button" key={item.label} className="filter-chip" onClick={() => update(item.clear, { push: true })} aria-label={`Remove ${item.label}`}><span className="max-w-64 truncate">{item.label}</span><span aria-hidden="true">×</span></button>)}
      </div>}
      {prompts.length === 0 ? (
        <div className="card px-6 py-12 text-center"><p className="text-xl font-semibold">No prompts match just yet.</p><p className="mt-2 text-base text-foreground-muted">Try a broader search, or remove a filter to see more starting points.</p><button type="button" onClick={() => update({ q: "", useCase: "", tag: "" }, { push: true })} className="btn-primary mt-6">Show all prompts</button></div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy={isPending}>
          {prompts.map((prompt) => <li key={prompt.slug} className="min-w-0">
            <Link href={`/prompts/${prompt.slug}`} className="group card flex h-full flex-col p-6 transition duration-200 hover:border-accent/60 hover:shadow-lg hover:shadow-black/5">
              <div className="flex items-center justify-between gap-3"><span className="pill-tag text-accent">{prompt.useCase}</span><span className="font-mono text-lg text-accent" aria-hidden="true">{ "{ }" }</span></div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight group-hover:text-accent">{prompt.title}</h3>
              <p className="mt-3 text-base leading-7 text-foreground-muted">{prompt.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground-muted" aria-label={`Tags: ${prompt.tags.join(", ")}`}>{prompt.tags.map((item) => <span key={item}>#{item}</span>)}</div>
              <div className="mt-auto pt-6">
                <p className="border-t border-border pt-4 text-sm text-foreground-muted">{prompt.compatibleModels.join(" · ")}</p>
                <p className="mt-2 text-xs text-foreground-muted">{prompt.testedAt ? `Sample testing date: ${prompt.testedAt}` : "Untested sample"}</p>
                <div className="mt-5 flex items-center justify-between text-sm"><span className="text-foreground-muted">{prompt.variables.length} editable details</span><span className="font-semibold text-accent">Adapt prompt <span aria-hidden="true">→</span></span></div>
              </div>
            </Link>
          </li>)}
        </ul>
      )}
    </section>
  );
}
