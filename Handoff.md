# Prompt Dictionary — handoff

Read this file first. It is the current-state index, not a design or test log.

## Product in one sentence

A public knowledge platform for reliable AI agents, combining versioned prompts/harnesses/skills/workflows, community problem-solving, and evidence of what works—starting with coding agents. Scope and non-goals: [PRODUCT.md](PRODUCT.md).

## Current state

- **Implemented:** fixture-backed discovery and URL filters; prompt details with an honest unavailable community-action/discussion state when no persistent prompt ID exists; safe variable substitution with declared editable variables required to appear in their template; preview, copy, and share links; Supabase email/password auth boundaries with allowlisted internal return paths; submission, account contribution status with pending/error recovery for resubmission and deletion, saved-prompt listing, bookmark, feedback, and report server actions; signed-in saved/feedback action state; a public profile (handle/display name/bio) per account, auto-created at signup, editable from the account page, with a public `/u/<handle>` page listing that author's published prompts; per-prompt discussion (question/correction/failure-report/solution/general comments, one level of replies, own-comment delete, comment reporting); published-prompt and filter-facet queries with fixture fallback; responsive shared UI.
- **Configured, not live-verified:** local Supabase public configuration and two proposed SQL migrations (prompts/bookmarks/feedback/reports; profiles/comments) with RLS, moderation transitions, rate limits, full-text search, and keyset indexes.
- **Verified:** lint, strict TypeScript, and 123 unit tests passed on 2026-09-20, including fixture fallback for published filter facets, the submitted-variable/template binding invariant, and mocked-Supabase coverage of every mutation's authorization boundary (anonymous/tampered-ID rejection, payload correctness) across `mutations.test.ts`, `account.test.ts`, and the new `profiles`/`comments` feature tests. The 16-test chromium Playwright suite passed on 2026-09-20 (full 48-run cross-engine matrix last confirmed 2026-09-19); anonymous fixture-backed flows include the unavailable community-action/discussion state for fixture prompts. The default (Turbopack) production build passed on 2026-09-20 in this sandbox, including the new `/u/[handle]` route — treat build success as environment-dependent until confirmed against the actual deployment/CI target (FW-13). See [tests.md](tests.md).
- **Not implemented:** harness/skill/workflow/guide resource types, discussion on non-prompt resources, comment editing/revision history, solution recognition, failure/evaluation records, contribution editing, moderator queue/actions, and database integration tests.
- **Not verified:** live auth, migration execution (confirmed on 2026-09-20 that the configured non-production Supabase project has neither migration applied — its `prompts` table does not exist), RLS/trigger behavior, authenticated browser flows (submit/edit/bookmark/feedback/moderation/profile edit/comment post-reply-delete-report), and production deployment behavior.

The previously in-progress worktree changes (contribution, account, and community-action features) are committed and pushed to `origin/main`. Do not treat implementation as verification.

## Context map

| Need | Read | Owner of |
| --- | --- | --- |
| Product goal, MVP, invariants | [PRODUCT.md](PRODUCT.md) | Product scope and non-goals |
| System shape and contracts | [architecture.md](architecture.md) | Technical/design decisions and open contracts |
| Acceptance and evidence | [tests.md](tests.md) | Test strategy, commands, and actual results |
| Remaining work | [FUTURE_WORK.md](FUTURE_WORK.md) | Prioritized tasks, dependencies, and completion gates |
| Setup | [README.md](README.md) | Human-facing local setup |
| Agent behavior | `AGENTS.md` / `CLAUDE.md` | Context routing and maintenance rules |

## Start here

1. Check `git status --short`; preserve unrelated work.
2. Load only the document(s) in the context map that govern the task.
3. Confirm whether relevant behavior is **proposed**, **implemented**, or **verified**.
4. For Next.js code, read the relevant versioned guide under `node_modules/next/dist/docs/` first.
5. After meaningful work, update only the owning documents named above.

## Documentation rule

Keep this snapshot short. Replace stale statements; do not append a session diary. Put exact check evidence in `tests.md`, durable decisions in `architecture.md`, and unfinished work in `FUTURE_WORK.md`. Never record secrets.
