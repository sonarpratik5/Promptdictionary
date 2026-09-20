# Prompt Dictionary

Prompt Dictionary is becoming a public knowledge platform for reliable AI agents: versioned prompts, harnesses, skills, workflows, and guides; community troubleshooting; and evidence of what works for particular models and tasks. It starts with coding agents, where outcomes can often be tested objectively. The current application implements the first prompt-library slice; the broader resource, discussion, revision, and evaluation systems are planned.

## Stack

- Next.js 16 and React 19
- TypeScript and Tailwind CSS 4
- Supabase Auth and PostgreSQL (integration pending)
- Netlify deployment configuration in `netlify.toml`

## Local development

Copy `.env.example` to `.env.local` and add the Supabase project values when authentication is enabled. Then run:

```sh
pnpm install
pnpm dev
```

If `pnpm` is not on `PATH` (a `corepack enable` failure with `EACCES` writing its shim is a common cause), use `npx pnpm@10.0.0 install` / `npx pnpm@10.0.0 dev` instead, or invoke an already-installed tool directly, e.g. `./node_modules/.bin/next dev`.

Authentication and contributions require `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from Supabase Project Settings → API. The older `NEXT_PUBLIC_SUPABASE_ANON_KEY` name is also supported. After adding them, restart `pnpm dev`. Apply the SQL migration in `supabase/migrations/` before using submissions, bookmarks, feedback, or reports.

Without Supabase configuration, the public library uses fixture data. With Supabase configured, published prompts and their discovery facets read from the database, with fixtures as a recoverable read fallback. The `/submit` contribution flow is implemented against the planned Supabase schema, but requires a configured and migrated Supabase project before it can accept submissions.

## Testing

```sh
pnpm test       # Vitest unit tests
pnpm test:e2e   # Playwright browser tests (anonymous, fixture-backed flows only)
```

`pnpm test:e2e` installs its own Chromium build on first run (`npx playwright install chromium`) and starts `next dev` on port 3100 automatically. See [tests.md](tests.md) for current coverage and gaps.

If `pnpm` is unavailable, run the same checks via `./node_modules/.bin/vitest run`, `./node_modules/.bin/eslint .`, `./node_modules/.bin/tsc --noEmit`, and `./node_modules/.bin/playwright test`.
