import Link from "next/link";

export default function NotFound() {
  return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl px-5 py-16">
    <div className="card p-8 sm:p-12">
      <p className="eyebrow">404 · Page not found</p>
      <h1 className="page-title mt-4">Let’s find another starting point.</h1>
      <p className="mt-5 text-lg leading-7 text-foreground-muted">This page isn’t in the library. Explore the available prompts or try a new search.</p>
      <Link href="/#explore" className="btn-primary mt-8">Back to the library</Link>
    </div>
  </main>;
}
