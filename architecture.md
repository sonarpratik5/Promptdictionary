# Architecture

Status: public discovery/adaptation is implemented and verified; Supabase authentication boundary and account UX are implemented but require project environment configuration. The contribution/moderation schema and submission validation are authored and unit-tested; persistence is proposed and unverified against a live database. This file owns technical decisions and structure. Product scope lives in [Handoff.md](Handoff.md); verification lives in [tests.md](tests.md).

## Stack and boundaries
- TypeScript (strict), React, Next.js App Router, Tailwind CSS, semantic HTML. One application initially to minimize operational overhead.
- PostgreSQL via Supabase for persistence/authentication; SQL migrations, generated database types, row-level security (RLS), indexed full-text search. No separate search service initially.
- Zod validates untrusted mutation inputs; pnpm manages dependencies; ESLint, Vitest, and Playwright provide planned checks. Select compatible stable versions at initialization and commit the lockfile.
- Server Components load initial data; small Client Components own interactive controls. Feature modules own validation, queries, and mutations; routes compose them.
- Browser → validated server mutation → authorization → database policy → persistence → public-cache invalidation. Never trust client-provided ownership or role claims; keep privileged credentials server-only.
- Cache only public data with explicit invalidation after changes. Private account data must never enter shared caches. Paginate queries and select only needed columns.

## Product contracts
- Anonymous users can browse published prompts, filter, adapt variables, and copy. Authentication is required for persistent contributions, bookmarks, and feedback.
- Prompt fields: title, description, template, variable definitions, use case/tags, author, model/version compatibility, testing date, example input/output, and limitations. Missing testing evidence must be displayed as untested; author claims and community feedback remain distinct.
- Adaptation changes a local copy, never the stored template. Templates are text; do not evaluate code, execute instructions, or call an LLM.
- Only owners may edit their submissions; moderation privileges require an explicit role. Draft, pending, published, and rejected are proposed publication states; only published content is public.
- Bookmarks and usefulness feedback are unique per user/prompt. Reports and moderation actions require restricted access. Enforce constraints and ownership in the database as well as server logic.
- Filter/search state belongs in the URL. Every interactive flow needs loading, empty, error, and success states. Render user content safely and rate-limit writes.
- Mobile-first, keyboard accessible, visible focus, readable contrast. Performance targets and their verification belong in `tests.md`.

## Current structure
```text
src/
  app/                    # Routes, layouts, loading/error boundaries
    page.tsx              # Searchable library
    prompts/[slug]/       # Prompt detail
    submit/               # Create/edit flow
    account/              # Profile, own prompts, bookmarks
    auth/                 # Sign-in and callback
  components/ui/          # Shared accessible primitives
  features/prompts/       # Prompt UI, schemas, queries, mutations
  features/auth/          # Session/account behavior
  lib/supabase/           # Browser/server clients, database types
  lib/                    # Shared utilities/configuration
supabase/migrations/      # Schema, indexes, constraints, RLS
tests/                   # Integration and end-to-end tests
public/                   # Static assets
```
Implemented: public routes and fixture queries, plus `app/auth`, `features/auth/actions.ts`, `features/auth/credentials.ts`, Supabase server/browser clients, `src/proxy.ts`, `netlify.toml` (Next.js build/deploy settings), `supabase/migrations/20260912200000_prompts_schema.sql` (proposed, unverified against a live database — see `tests.md`), and `features/prompts/schema.ts` (submission validation, unit-tested). Auth uses email/password, password recovery, Zod-validated server actions, cookie-backed SSR sessions, and an email callback. The proxy refreshes a session with `getClaims`, then writes new cookies to both the in-flight request and response; the callback sends missing, expired, or invalid codes to a recoverable auth state and permits only `/auth/reset` as its post-exchange destination. Password reset requests return the same success message whether or not an account exists, and the dynamic reset page requires the recovery session before calling `updateUser`. Routes use fixture data only; contribution/bookmark persistence and database policies remain absent. Without Supabase environment variables, auth pages truthfully show setup guidance and public browsing remains available. Unit tests are colocated with the renderer, share boundary, query boundary, and auth validation boundary. Root documentation: `Handoff.md`, `architecture.md`, `tests.md`, `AGENTS.md`, `CLAUDE.md`.

The current visual system is intentionally code-native: Tailwind utilities plus a small global token layer in `app/globals.css` provide the palette, typography, and a handful of reusable component classes. It uses no remote fonts, image assets, or client-side visual dependencies, keeping the public slice fast and self-contained. Shared shell markup belongs in `app/layout.tsx`; library and adaptation interactions remain in their existing client components.

## Design direction and development guide

Implemented 2026-09-12: a focused library workspace with cool neutral surfaces, a deep teal action color, generous but functional spacing, and a dark adaptation preview. The brief authorizes implementation across existing routes. No hosting migration, external fonts, image assets, visual dependencies, or new account/persistence capabilities were introduced. This is an existing local Next.js application, not a Sites checkout.

### Research and visual references
- [Tuch et al., 2012, International Journal of Human-Computer Studies](https://research.google/pubs/the-role-of-visual-complexity-and-prototypicality-regarding-first-impression-of-websites-working-towards-understanding-aesthetic-judgments/): two screenshot studies found low visual complexity and familiar layouts more appealing. Application here: place search before results and remove the large decorative hero/terminal/stat blocks. This evidence concerns first impressions, not measured success or conversion for this product.
- [NN/g: five principles of visual design](https://www.nngroup.com/articles/principles-visual-design/): use scale, grouping, and hierarchy to distinguish the page purpose, controls, and result metadata.
- [Apple foundations](https://developer.apple.com/design/human-interface-guidelines/foundations) and [ChatGPT overview](https://chatgpt.com/overview/): visual reference points for restrained typography, spacious controls, and clear content surfaces. Apple’s color documentation was JavaScript-only in the research tool; no detailed recommendation is attributed to that unreadable page.
- [Stack Overflow questions](https://stackoverflow.com/questions): reference for discovery through task titles, tags, and useful metadata. Community reputation and vote counts are intentionally absent until real data exists.
- [Dribbble minimal dashboards](https://dribbble.com/tags/minimal-dashboard) and [Behance dashboard projects](https://www.behance.net/search/projects/ui%20ux%20dashboard): surveyed layout references, including search-oriented dashboard compositions. These galleries are inspiration, not usability evidence or a verified ranking of designers.
- [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): use at least 4.5:1 for normal text and 3:1 for essential control boundaries/focus. Calculations and remaining verification are recorded in `tests.md`.

### Visual system
| Role | Implementation | Usage |
| --- | --- | --- |
| Canvas / surface | `#f7f8fa` / `#ffffff` | Distinguish working background from cards; light mode only. |
| Main / secondary text | `#182226` / `#59666d` | Primary reading and supporting information; do not dim essential text further. |
| Action / hover | `#086c63` / `#07564f` | Links, primary actions, selected filters; one accent family reduces competing signals. |
| Accent tint | `#e2f2ee` | Selected filter and notice backgrounds. |
| Dark preview / accent | `#14282b` / `#83ddcb` | Separate generated text from editable fields; brighter focus and copy action on this surface. |
| Borders | `#dce2e5` / `#85939c` | Subtle grouping versus visible input boundaries. |
| Status | Success and danger tokens | Always accompany colors with plain status text. Teal alone does not imply successful validation. |

The palette is an art-direction choice, not a claim that teal universally causes trust or productivity. Change semantic tokens as a set when a logo is chosen, then repeat contrast and route checks. The text-only braces mark is provisional.

Use system sans-serif typography, 16px body/input text, 14px labels/actions, and 12px only for secondary metadata. `.page-title` scales from 36px to 48px; keep headings readable at narrow widths. Use a 4px spacing rhythm, 12px input/button corners, 16px cards, and pills for short metadata. The common container is `max-w-6xl`; account recovery uses `max-w-2xl`. Primary controls have a 44px minimum height. Small hover color/shadow transitions clarify action; reduced-motion preferences disable animations and transitions.

Shared classes live in `app/globals.css`: `.card`, `.field`, `.page-title`, `.back-link`, `.eyebrow`, `.btn-primary`, `.btn-secondary`, `.btn-quiet`, `.pill-tag`, `.filter-chip`, `.preview-panel`, and alert variants. Tailwind v4 component classes each apply utilities directly. The old macOS chrome and hero-glow classes are removed. The shared layout owns the wordmark, navigation, skip link, and footer. Every page supplies `main-content` as a programmatically focusable skip destination.

### Page and interaction patterns
- **Library:** compact introduction, honest sample count, search and topic control, visible use-case buttons with `aria-pressed`, removable active filters, result count, and responsive cards. Search has a clear action that restores focus to the input. Result updates announce atomically and filter chips are explicit non-submit buttons. Cards show description, tags, listed model compatibility, explicitly sample testing dates/untested status, and editable-field count. The three fixture prompts keep their original order. No sorting/ranking policy was added.
- **Detail:** shared heading scale and back link, listed model compatibility, tags, sample evidence and limitations, then the editor. A light input column and dark text preview stack on smaller screens. Textareas support multiline context and align with the existing 2,000-character share boundary. Required and optional fields have text labels and connected descriptions. The preview is keyboard-focusable and wraps long text. Missing values use readable field labels. Copy status, clipboard fallback, and URL-based sharing remain intact; the editor explains that values enter URLs.
- **Accounts:** shared tokens and responsive headings; sign-in has a quiet introductory panel and form card. Copy distinguishes planned shelves/contributions from working anonymous access. Unconfigured authentication/recovery shows user-facing availability guidance, not environment-variable instructions. The auth form is keyed by mode so switching modes clears stale action feedback.
- **Loading/error/404:** shared shell and palette, reduced-motion skeleton, clear retry or return-to-library actions. Callback routes have no independent page; their feedback appears in the existing auth states.

### Further development, in order
1. Complete browser acceptance at 360px, 768px, and 1440px plus 200% zoom: search without focus loss, use-case/topic combinations, clear/reset, back/forward, keyboard skip/focus, long multiline preview, clipboard success/failure, shared-link round trip, account/error states. Run a short task-based usability study: find a code review prompt, adapt it, and copy/share it. Record task completion, errors, and confusion; do not claim improvement before observation.
2. Connect a non-production Supabase project and verify authentication. Keep anonymous discovery/copy available; only show account-specific benefits when the corresponding feature exists.
3. Against that same project, run `supabase/migrations/20260912200000_prompts_schema.sql` and verify its constraints and RLS policies with real integration tests (anonymous, owner, another user, moderator — see `tests.md`) before adding data-backed UI. Preserve query/share boundaries and URL filters. Replace the fixture labels only when actual evidence and publication policy are confirmed against the live schema.
4. Introduce submissions and personal shelves using existing cards, fields, status messages, and action hierarchy. Plan empty/loading/error/success states together. Avoid dead navigation or placeholder actions for future features.
5. Finalize logo and brand, then evaluate dark mode as a complete token system across all routes. Collect real performance and usability evidence before adding animation, additional assets, or larger client dependencies.

The route layer calls `features/prompts/queries.ts` rather than accessing fixture storage directly. `listPrompts` owns the current case-insensitive search and AND-combined use-case semantics; `getPromptBySlug` and `listPromptSlugs` provide the corresponding detail and static-route lookups. The module is intentionally read-only so its backing source can change to published database queries later.

## Implemented interaction contracts
- The current public library lists only its local fixture prompts. Search (`q`), use-case (`useCase`), and tag (`tag`) filters are URL query parameters. Search is case-insensitive across title, description, use case, and tags; tag matching is case-insensitive and exact; all active filters combine with AND semantics. Prompt-detail tags link to the corresponding library filter.
- The search input begins from the parsed URL query, keeps a local draft while typing, and updates the URL after a 250 ms debounce. An external URL change updates an unchanged draft for refresh/back/forward navigation, while a newer local draft is retained during an in-flight navigation; the input never remounts just because a query commits. Server-filter transitions expose a polite pending status. This avoids a navigation for every keystroke while preserving shareable state and focus.
- The first adaptation contract is resolved: only declared lowercase `snake_case` tokens in the exact form `{{name}}` substitute. A supplied non-whitespace value wins and retains its supplied text; otherwise a declared default applies. Unknown or malformed tokens stay literal text. A missing required value stays visible as its token, reports the variable name, and disables copy. User input is text and is never executed.
- Adaptation values are shareable through the URL: each declared variable maps to a `v.<name>` query parameter (`?v.audience=new+hires`). `src/features/prompts/share.ts` owns both directions and is the trust boundary — it accepts values only for variables the prompt declares, drops blank and over-2000-character values, and rejects (never truncates) an oversized value so a shared link cannot misrepresent what was sent. A link can therefore never introduce a variable, and its values stay text passed to `renderTemplate`.
- `PromptCustomizer` derives shared values from `useSearchParams()` rather than copying them into state on mount; local edits live in a separate `null`-until-touched state that takes over on the first keystroke. That avoids a mount-time state write (which `react-hooks/set-state-in-effect` rejects) and a second render. Because `useSearchParams` bails out of prerendering, the route wraps the component in `Suspense`, which keeps prompt detail pages statically generated. Typing updates the address bar with `history.replaceState`, so the link stays shareable without a navigation per keystroke.
- The prompt route sets `dynamicParams = false`. Without it, Next prerendered the `notFound()` result for an unknown slug and served it with HTTP 200; this must be revisited once prompts are database-backed and new slugs must resolve without a rebuild.
- Adapted values are Client Component state only. They do not mutate the fixture/store. Clipboard failures remain truthful and give a manual-copy recovery path; editing any adaptation value clears a prior copy confirmation so it cannot describe stale clipboard content.
- Prompt testing evidence is shown as a fixture testing date or `Untested`; it is not a claim that the application has independently verified the prompt.

## Resolved decisions
Decisions below are encoded in `supabase/migrations/20260912200000_prompts_schema.sql` and `src/features/prompts/schema.ts`. The migration is authored and reviewed for syntax only; it has not been run against a live Postgres/Supabase instance (see `tests.md`). Treat it as proposed schema until an integration check confirms the constraints and RLS policies behave as intended.

- **Required submission fields and evidence rules:** title, description, template, use case, at least one tag, at least one compatible model, and limitations are required; variables, tested-at date, and a sample input/output pair are optional. A sample input and output must be provided together or not at all, so a lone "example output" can never imply an unverified input. Variable names must be unique and match the existing `{{name}}` lowercase snake_case token contract in `template.ts`. Author claims (tags, compatibility, limitations) and future community feedback stay in separate tables (`prompts` vs. `prompt_feedback`) so one can never be mistaken for the other.
- **Search ordering:** the fixture library keeps insertion order (unchanged). Database-backed results order by `published_at desc, id` — newest published first, with `id` as a stable tie-breaker for keyset pagination.
- **Pagination:** keyset (cursor) pagination on `(published_at, id)`, not offset, because offset pagination can duplicate or skip rows when new prompts are published between page requests — the acceptance criterion in `tests.md` requires no duplicates. Default/likely page size is left to the UI; the index (`prompts_published_keyset_idx`) supports any reasonable size.
- **Moderation states and transitions:** `draft → pending → published | rejected`. Owners create in `draft`, submit to `pending`, and may resubmit from `rejected`. Only a moderator (membership in the `moderators` table, checked via `is_moderator()`) may move a prompt to `published` or `rejected`; this is enforced in a trigger, not only in RLS, per the "enforce in the database" contract. An owner may still edit a published prompt, but the edit reverts its status to `pending` so an unreviewed change is never shown as already approved. Owners may delete only `draft`/`rejected` prompts; a published prompt requires moderation, not a silent delete, to leave the record of what was public.
- **Feedback scale:** binary "was this useful" (`is_helpful boolean`), one row per user/prompt, upserted. Simpler than a star scale while there is no reviewer volume to make finer granularity meaningful, and it keeps the uniqueness/abuse-resistance constraint trivial. Revisit if evidence later shows binary feedback is too coarse.
- **Rate limits:** at most 20 new prompt submissions and 10 reports per user per rolling 24 hours, enforced by a `before insert` trigger (not just app code) so direct API/database access cannot bypass it. Bookmarks and feedback are not separately rate-limited: both are unique-constrained upserts, not append-only inserts, so repeating the same request cannot create duplicate load.
- **Database policy:** RLS is enabled on every new table. Anonymous/authenticated reads see `published` rows plus the requester's own rows; moderators see everything. Inserts must set `owner_id`/`user_id`/`reporter_id` to the caller's own `auth.uid()`. Authentication provider remains Supabase Auth with email/password for the MVP; OAuth can be added later without changing the session boundary.

Still open, and deliberately not decided by this schema work:
- **Hosting:** Netlify is selected for the deployed application. `netlify.toml` sets `pnpm build`, `.next`, Node 22, and the production site URL. The repository still needs to be connected to the Netlify site, and Supabase variables must be configured in Netlify's environment settings.
- **Exact pagination page size** and any UI-level rate-limit messaging/backoff.
- **Generated database types** (`src/lib/supabase/database.types.ts`): normally produced by running the Supabase CLI against a live project; there is none configured yet, so this file does not exist. Generate it once a project is connected, per the next step below.

## Actual setup
- `package.json` declares a pnpm 10 project with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zod, ESLint, and Vitest version ranges. `tsconfig.json`, ESLint flat configuration, and Tailwind PostCSS configuration are present.
- `pnpm install` completed with the temporary official Node.js v24.21.0 ARM64 runtime and pnpm 10.0.0. `pnpm-lock.yaml` and `node_modules` exist. Resolved direct versions: Next.js 16.3.5, React/React DOM 19.3.0, Tailwind CSS and `@tailwindcss/postcss` 4.3.3, Zod 4.6.2, TypeScript 5.9.3, ESLint 9.39.5, `eslint-config-next` 16.3.5, Vitest 3.2.7, `@types/node` 22.20.2, and React type packages 19.3.0.
- The local runtime is temporary but currently still present at `/private/tmp/node-v24.21.0-darwin-arm64/bin` (with pnpm 10.0.0 under `/private/tmp/node-cache/node/corepack/v1/pnpm/10.0.0/bin/pnpm.cjs`); prepend it to `PATH` to run the package scripts. The shell still has no globally installed `node`, `npm`, or `pnpm`, and `/private/tmp` is not durable. Future commands need a supported Node.js/pnpm installation or an equivalent project-local setup.
- `.env.example` documents the required public Supabase URL/key and optional site URL. The anon key is intended for browser use; no service-role key is accepted by this feature. Authentication is not operational until these values are provided and email confirmation settings are configured in Supabase.

Reference: [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
