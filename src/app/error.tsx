"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-5 py-16">
      <p className="eyebrow">
        Something went wrong
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">The prompt library could not load.</h1>
      <p className="mt-3 text-foreground-muted">
        Try again. If the problem continues, please come back later.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="btn-primary mt-6 px-4 py-2"
      >
        Try again
      </button>
    </main>
  );
}
