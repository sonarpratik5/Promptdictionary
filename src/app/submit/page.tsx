import Link from "next/link";
import { PromptSubmitForm } from "@/components/prompt-submit-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const params = await searchParams;
  const user = isSupabaseConfigured() ? await createSupabaseServerClient().then((client) => client.auth.getUser()).then(({ data }) => data.user).catch(() => null) : null;
  return <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-10 md:py-14"><Link href="/" className="back-link">← Back to the library</Link><p className="eyebrow mt-8">Community contribution</p><h1 className="mt-3 page-title">Share a prompt that works.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-foreground-muted">Add a useful starting point for someone else. Your submission is reviewed before it appears in the public library.</p>
    {params.submitted === "1" && <p className="alert-success mt-8" role="status"><strong>Prompt sent for review.</strong> We’ll keep it out of the public library until a moderator approves it.</p>}
    {!isSupabaseConfigured() ? <div className="alert-notice mt-8"><strong>Contributions are not connected yet.</strong><br />The library is still available for browsing and adapting.</div> : !user ? <div className="card mt-8 p-6"><p className="text-lg font-semibold">Sign in to share a prompt.</p><p className="mt-2 text-foreground-muted">An account lets us attribute your contribution and show you its review status.</p><Link href="/auth?next=/submit" className="btn-primary mt-5">Sign in</Link></div> : <section className="card mt-8 p-6 md:p-8" aria-label="Prompt submission"><PromptSubmitForm /></section>}
  </main>;
}
