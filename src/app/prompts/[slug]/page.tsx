import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PromptCustomizer } from "@/components/prompt-customizer";
import { PromptCommunityActionForms } from "@/components/prompt-community-actions";
import { getCommunityPromptState } from "@/features/prompts/account";
import { getPublishedPromptBySlug, listPromptSlugs } from "@/features/prompts/queries";

/** Database-backed prompts need on-demand route rendering; unknown slugs still 404. */
export const dynamicParams = true;

export function generateStaticParams() {
  return listPromptSlugs().map((slug) => ({ slug }));
}

export default async function PromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prompt = await getPublishedPromptBySlug(slug);
  if (!prompt) notFound();
  // Fixture prompts have no persistent ID, so community mutations cannot be
  // addressed safely. Render the same honest unavailable state used when the
  // project connection cannot be reached rather than omitting this capability.
  const communityState = prompt.id ? await getCommunityPromptState(prompt.id) : { kind: "unavailable" as const };
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
      <section className="mt-8 grid gap-5 border-t border-border pt-8" aria-labelledby="community-actions-heading">
        <h2 id="community-actions-heading" className="text-xl font-semibold">Help improve the library</h2>
        {communityState.kind === "unavailable" ? <p className="text-sm leading-6 text-foreground-muted">Community actions are unavailable right now. You can still adapt and share this prompt.</p>
          : communityState.kind === "anonymous" ? <p className="text-sm leading-6 text-foreground-muted"><Link href={`/auth?next=${encodeURIComponent(`/prompts/${prompt.slug}`)}`} className="font-semibold text-accent underline-offset-4 hover:underline">Sign in</Link> to save this prompt, leave feedback, or report a problem.</p>
            : <PromptCommunityActionForms promptId={prompt.id!} initialSaved={communityState.saved} initialFeedback={communityState.feedback} />}
      </section>
    </main>
  );
}
