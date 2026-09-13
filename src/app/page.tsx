import { PromptLibrary } from "@/components/prompt-library";
import { listPrompts, listTags, listUseCases } from "@/features/prompts/queries";

type SearchParams = Promise<{ q?: string | string[]; useCase?: string | string[]; tag?: string | string[] }>;
const one = (value: string | string[] | undefined) => typeof value === "string" ? value : "";

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = one(params.q).trim();
  const useCase = one(params.useCase).trim();
  const tag = one(params.tag).trim();
  const visiblePrompts = listPrompts({ query, useCase, tag });
  const useCases = listUseCases();
  const tags = listTags();

  return (
    <main id="main-content" tabIndex={-1}>
      <header className="mx-auto max-w-6xl px-5 pb-8 pt-10 md:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="eyebrow">The prompt library</p>
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground-muted">Early preview · {listPrompts({}).length} sample prompts</span>
        </div>
        <h1 className="page-title mt-5">Good work starts with<br className="hidden sm:block" /> <span className="text-accent">a better prompt.</span></h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-foreground-muted">Find a useful starting point. Add your context. Make it yours.</p>
      </header>
      <PromptLibrary prompts={visiblePrompts} query={query} useCase={useCase} tag={tag} useCases={useCases} tags={tags} />
      <section aria-label="How to use the library" className="mx-auto max-w-6xl px-5 pb-12">
        <ol className="grid gap-5 rounded-2xl border border-border px-6 py-6 sm:grid-cols-3">
          {[['01', 'Find a pattern', 'Search by task or explore a use case.'], ['02', 'Add your context', 'Fill in the details and preview your version.'], ['03', 'Put it to work', 'Copy into your AI tool. No sign-in needed.']].map(([step, title, description]) => <li key={step} className="flex gap-3"><span className="pt-1 font-mono text-xs text-accent" aria-hidden="true">{step}</span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-foreground-muted">{description}</p></div></li>)}
        </ol>
      </section>
    </main>
  );
}
