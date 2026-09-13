import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PromptCustomizer } from "@/components/prompt-customizer";
import { getPromptBySlug, listPromptSlugs } from "@/features/prompts/queries";

/**
 * Every prompt comes from the fixture source, so unknown slugs are 404s rather
 * than on-demand renders. Without this, Next prerendered the `notFound()`
 * result for an unknown slug and served it with HTTP 200. Revisit when prompts
 * are database-backed and new slugs must resolve without a rebuild.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return listPromptSlugs().map((slug) => ({ slug }));
}

export default async function PromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prompt = getPromptBySlug(slug);
  if (!prompt) notFound();
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <Link href="/" className="back-link"><span aria-hidden="true">←</span> Back to all prompts</Link>
      <div className="mt-6 grid gap-8 md:grid-cols-[1.15fr_.85fr] md:items-end">
        <div>
          <p className="eyebrow">{prompt.useCase}</p>
          <h1 className="mt-3 page-title">{prompt.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground-muted">{prompt.description}</p>
        </div>
        <div className="rounded-2xl bg-background-secondary p-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-foreground-muted">Listed compatibility</p><p className="mt-2 text-xl font-semibold text-foreground">{prompt.compatibleModels.join(" · ")}</p><p className="mt-5 border-t border-border pt-4 text-sm leading-6 text-foreground-muted">Adapt the prompt below, then paste it into your preferred AI tool.</p></div>
      </div>
      <div className="mt-7 flex flex-wrap gap-2" aria-label="Tags">
        {prompt.tags.map((tag) => (
          <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent">#{tag}</Link>
        ))}
      </div>
      <dl className="my-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border text-sm md:grid-cols-2">
        <div className="bg-surface p-5"><dt className="text-xs font-semibold uppercase tracking-[.15em] text-foreground-muted">Testing evidence</dt><dd className="mt-2 font-semibold text-foreground">{prompt.testedAt ? `Sample testing date: ${prompt.testedAt}` : "Untested sample"}</dd></div>
        <div className="bg-surface p-5"><dt className="text-xs font-semibold uppercase tracking-[.15em] text-foreground-muted">Keep in mind</dt><dd className="mt-2 leading-6 text-foreground-muted">{prompt.limitations}</dd></div>
      </dl>
      <Suspense fallback={<div className="h-96 rounded-2xl border border-border bg-surface" aria-hidden="true" />}>
        <PromptCustomizer prompt={prompt} />
      </Suspense>
    </main>
  );
}
