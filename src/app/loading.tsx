export default function Loading() {
  return <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12" aria-busy="true">
    <p className="eyebrow" role="status">Loading the library…</p>
    <div aria-hidden="true" className="mt-6 animate-pulse">
      <div className="h-14 max-w-lg rounded-xl bg-background-secondary" />
      <div className="mt-8 h-20 rounded-2xl border border-border bg-surface" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="card h-72" />)}</div>
    </div>
  </main>;
}
