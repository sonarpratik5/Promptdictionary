# Architecture

This file owns durable technical and UX contracts. Product scope is in [PRODUCT.md](PRODUCT.md), evidence in [tests.md](tests.md), and planned work in [FUTURE_WORK.md](FUTURE_WORK.md).

## Status

Prompt discovery/adaptation and auth boundaries are implemented. Supabase-backed prompt contribution and community actions, including per-viewer saved/feedback state and safe post-auth return paths, are implemented but not runtime-verified. Harnesses, skills, workflows, guides, discussion, revision history, and evaluation records are product targets, not implemented behavior. The database migration is proposed until executed and integration-tested.

## Stack and boundaries

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Zod, pnpm.
- Supabase Auth/PostgreSQL with SQL migrations, generated types, RLS, full-text search, and keyset pagination; no separate API or search service for MVP.
- Server Components load initial data. Small Client Components own interaction. Feature modules own queries, validation, and mutations; routes only compose them.
- Mutation path: untrusted input → Zod validation → authenticated server action → authorization/RLS → persistence → targeted cache invalidation.
- Public data may be cached explicitly. Account data must not enter shared caches. Privileged credentials stay server-only.

## Source map

```text
src/app/                    routes, layouts, loading/error states
src/components/             shared and interactive UI
src/features/prompts/       prompt queries, schemas, rendering, sharing, mutations
src/features/auth/          credential validation and auth actions
src/lib/supabase/           browser/server clients and future generated types
supabase/migrations/        schema, constraints, triggers, indexes, RLS
tests/e2e/                  Playwright browser suite (anonymous, fixture-backed flows only; chromium/firefox/webkit)
```

Future integration tests against a live Supabase project have no home yet; add a `tests/integration/` directory when FW-04 unblocks them.

Routes must use `src/features/prompts/queries.ts`; they must not import fixture storage directly. Share URLs must pass through `src/features/prompts/share.ts`. Auth forms must pass through `src/features/auth/credentials.ts`.

## Core contracts

- Anonymous users can browse, filter, adapt, copy, and share published prompts. Persistent contributions, bookmarks, and feedback require authentication.
- Prompt/template/user content is untrusted text: render safely; never execute it, follow it as agent instruction, expose secrets, or call an LLM automatically.
- Search state lives in `q`, `useCase`, and `tag` URL parameters. Filters combine with AND semantics; tag matching is case-insensitive and exact.
- Discovery reads published prompts and its use-case/topic facets from Supabase when configured; any unavailable database read falls back to the local fixture set so local anonymous discovery remains usable. The UI does not label live rows as samples.
- Prompt detail routes render on demand (`dynamicParams = true`) so a database-backed slug published after the last build still resolves instead of 404ing; `generateStaticParams` still prebuilds the fixture slugs. An unknown or unpublished slug calls `notFound()` regardless of source.
- Discrete filter actions (use-case chip, topic select, clear buttons) push a browser history entry so back/forward steps through them; the debounced search box replaces so each keystroke pause does not add an entry.
- Only declared lowercase `snake_case` tokens in `{{name}}` form substitute. Every declared editable variable must appear in the submitted template as its exact token. Required missing values remain visible and disable copy. Adaptation never changes the stored template.
- Shared values use `v.<name>`, accept declared variables only, reject blank or over-2,000-character values, and remain inert text.
- Authentication can return only to `/`, `/submit`, `/account`, or a lowercase-slug prompt detail URL; supplied `next` values never become arbitrary redirects. The one exception is the literal `/auth/reset` destination, which the callback route allows through unchecked so a password-recovery email can land on the reset form.
- Community mutation IDs are validated UUIDs at the server boundary. Detail pages show an unavailable, signed-out, or signed-in action state; the latter reflects the signed-in viewer's saved and feedback records without exposing another user's state.
- Fixture prompts have no persistent mutation ID, so their detail pages explicitly show the unavailable community-action state instead of controls that cannot work.
- Every flow needs honest loading, empty, error, and success states. Mobile/keyboard access, visible focus, and readable contrast are release requirements.

## Forum resource contract

- A resource is a versioned `prompt`, `harness`, `skill`, `workflow`, or `guide` with one canonical page and stable identity.
- A harness documents its files/components, prerequisites, setup sequence, expected behavior, checks, limitations, and safe adaptation points. Uploaded text and commands are displayed or copied only; never run automatically.
- A skill packages one reusable capability; a workflow links ordered resources, tools, checks, and human decision points without duplicating their canonical content.
- Comments and replies belong to a resource/revision and support questions, corrections, failure reports, and solutions. They never modify the canonical resource.
- Authors can publish revisions; readers can identify which revision evidence and discussion refer to. Material edits return moderated resources to review.
- Search spans resource type, task, model/tool compatibility, tags, and text. Ranking must not imply effectiveness until supported by an explicit evidence policy.
- Failure/evaluation records refer to an exact resource revision and execution context: model/tool versions, task, fixture or inputs, expected and observed results, method, metrics, and limitations.
- Evidence distinguishes author claims, community experience, and reproducible evaluations. Token, compute, accuracy, and unsupported-output claims require a stated method and baseline; popularity is not evidence.
- Authenticated users create resources and discussion; anonymous users can read published content. Ownership, moderation, rate limits, and reporting are enforced server-side and in database policy.

The current schema models prompts, bookmarks, feedback, and reports only. General resources, revisions, comments, solution signals, failure cases, and evaluations require a new reviewed migration after the existing migration is verified.

## Data and authorization decisions

- Required prompt fields: title, description, template, use case, ≥1 tag, ≥1 model, and limitations. Variables, test date, and paired sample input/output are optional.
- Publication states: `draft → pending → published | rejected`; rejected items, and drafts left behind by a failed insert-to-pending transition, may be resubmitted to `pending`. Only moderators publish/reject. Editing published content returns it to `pending`.
- Owners may edit their submissions and delete only draft/rejected items. The account page only links to a prompt's own detail page when it is published, since that route resolves published rows only; other statuses show the title as plain text. Identity and moderator role are derived server-side and enforced again with RLS/triggers.
- Bookmarks are unique per user/prompt. Feedback is one upserted boolean usefulness vote per user/prompt.
- Database results order by `(published_at desc, id)` and use keyset pagination. Fixture results keep insertion order.
- Database triggers limit each user to 20 prompt submissions and 10 reports per rolling 24 hours; each trigger takes a per-owner `pg_advisory_xact_lock` before counting so concurrent inserts near the boundary cannot all read the same pre-insert count and exceed the cap.
- Anonymous reads expose published rows only; owners can also read their rows; moderators can read all rows.

These rules are encoded in `supabase/migrations/20260912200000_prompts_schema.sql` and `src/features/prompts/schema.ts`, but database behavior is not verified yet.

## UI system

- Code-native light theme: neutral surfaces, deep-teal action color, system fonts, 44px minimum primary controls, 4px spacing rhythm, and reduced-motion support.
- Shared shell owns navigation, skip link, and footer. The library prioritizes search/results; detail pages separate inputs from preview; account pages expose only implemented capability.
- Treat model compatibility and testing dates as author/fixture metadata, not independent proof. Show missing evidence as untested.

## Open contracts

- Choose an exact database page size and user-facing rate-limit/backoff behavior.
- Generate `src/lib/supabase/database.types.ts` after connecting the non-production project.
- Define the normalized resource/revision/comment/evidence schema, comment nesting limit, edit history, and solution-recognition policy before platform implementation.
- Define coding-agent evaluation fixtures and a reproducible evidence format before displaying efficiency or accuracy comparisons.
- Finalize brand tokens before considering a complete dark theme.

References: [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
