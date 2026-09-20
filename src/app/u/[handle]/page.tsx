import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProfile, listPublishedPromptsByOwner } from "@/features/profiles/queries";

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle.toLowerCase());
  if (!profile) notFound();
  const prompts = await listPublishedPromptsByOwner(profile.userId);
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-10 md:py-14">
      <Link href="/" className="back-link">← Back to the library</Link>
      <p className="eyebrow mt-8">Community member</p>
      <h1 className="mt-3 page-title">{profile.displayName}</h1>
      <p className="mt-2 text-foreground-muted">@{profile.handle}</p>
      {profile.bio && <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground-muted">{profile.bio}</p>}
      <section className="mt-10" aria-labelledby="published-heading">
        <h2 id="published-heading" className="text-2xl font-semibold">Published prompts</h2>
        {prompts.length === 0
          ? <p className="card mt-4 p-6 text-foreground-muted">No published prompts yet.</p>
          : <ul className="mt-4 grid gap-3 sm:grid-cols-2">{prompts.map((prompt) => <li key={prompt.id} className="card p-5"><p className="pill-tag w-fit text-accent">{prompt.useCase}</p><Link href={`/prompts/${prompt.slug}`} className="mt-3 block font-semibold hover:text-accent">{prompt.title}</Link></li>)}</ul>}
      </section>
    </main>
  );
}
