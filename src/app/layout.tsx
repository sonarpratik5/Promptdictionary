import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "Prompt Dictionary",
  description: "Find, adapt, and reuse community AI prompts.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = isSupabaseConfigured() ? await createSupabaseServerClient().then((client) => client.auth.getUser()).then(({ data }) => data.user).catch(() => null) : null;
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-accent focus:px-5 focus:py-3 focus:text-white">Skip to content</a>
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground" aria-label="Prompt Dictionary home">
              <span className="grid size-7 place-items-center rounded-lg bg-foreground font-mono text-xs text-white" aria-hidden="true">{ "{ }" }</span>
              Prompt Dictionary
            </Link>
            <nav aria-label="Main navigation" className="flex items-center gap-2 text-sm">
              <Link href="/#explore" className="btn-secondary px-3.5 py-1.5">Library</Link>
              {user ? <form action={signOut}><button className="btn-primary px-3.5 py-1.5">Sign out</button></form> : <Link href="/auth" className="btn-primary px-3.5 py-1.5">Sign in</Link>}
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-foreground-muted">
            <p>Prompt Dictionary <span aria-hidden="true">/</span> A starting point for your next idea.</p>
            <Link href="/#explore" className="back-link">Explore the library <span aria-hidden="true">→</span></Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
