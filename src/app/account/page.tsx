import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountPromptActions } from "@/components/account-prompt-actions";
import { ProfileForm } from "@/components/profile-form";
import { listOwnedPrompts, listSavedPrompts } from "@/features/prompts/account";
import { getOwnProfile } from "@/features/profiles/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusLabel: Record<string, string> = { draft: "Draft", pending: "In review", published: "Published", rejected: "Needs changes" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) return <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-5 py-14"><p className="alert-notice">Accounts are not connected yet. You can still browse and adapt prompts anonymously.</p></main>;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const [prompts, saved, profile] = await Promise.all([listOwnedPrompts(), listSavedPrompts(), getOwnProfile()]);
  return <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-10 md:py-14"><Link href="/" className="back-link">← Back to the library</Link><p className="eyebrow mt-8">Your account</p><h1 className="mt-3 page-title">Your workspace.</h1><p className="mt-4 text-lg leading-8 text-foreground-muted">Track contributions and keep useful prompts close at hand.</p>{params.updated === "1" && <p className="alert-success mt-6" role="status">Your prompt list was updated.</p>}<section className="mt-8" aria-labelledby="profile-heading"><h2 id="profile-heading" className="text-2xl font-semibold">Public profile</h2><p className="mt-2 text-foreground-muted">Shown on your comments and on your public page.</p><div className="mt-4"><ProfileForm profile={profile} /></div></section><section className="mt-10" aria-labelledby="contributions-heading"><h2 id="contributions-heading" className="text-2xl font-semibold">Contributions</h2>{prompts.length === 0 ? <div className="card mt-4 p-6"><p className="font-semibold">Nothing here yet.</p><p className="mt-2 text-foreground-muted">Share your first prompt with the community.</p><Link href="/submit" className="btn-primary mt-5">Share a prompt</Link></div> : <ul className="mt-4 grid gap-4">{prompts.map((prompt) => <li key={prompt.id} className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div>{prompt.status === "published" ? <Link href={`/prompts/${prompt.slug}`} className="text-lg font-semibold hover:text-accent">{prompt.title}</Link> : <p className="text-lg font-semibold">{prompt.title}</p>}<p className="mt-2 text-sm text-foreground-muted">Updated {new Date(prompt.updatedAt).toLocaleDateString()}</p></div><span className="pill-tag">{statusLabel[prompt.status] ?? prompt.status}</span></div>{prompt.rejectionReason && <p className="alert-danger mt-4">Moderator note: {prompt.rejectionReason}</p>}{(prompt.status === "rejected" || prompt.status === "draft") && <AccountPromptActions promptId={prompt.id} canResubmit={prompt.status === "rejected" || prompt.status === "draft"} canDelete />}</li>)}</ul>}</section><section className="mt-10" aria-labelledby="saved-heading"><h2 id="saved-heading" className="text-2xl font-semibold">Saved prompts</h2>{saved.length === 0 ? <p className="card mt-4 p-6 text-foreground-muted">Save prompts from their detail pages and they’ll appear here.</p> : <ul className="mt-4 grid gap-3 sm:grid-cols-2">{saved.map((prompt) => <li key={prompt.id} className="card p-5"><p className="pill-tag w-fit text-accent">{prompt.useCase}</p><Link href={`/prompts/${prompt.slug}`} className="mt-3 block font-semibold hover:text-accent">{prompt.title}</Link></li>)}</ul>}</section></main>;
}
