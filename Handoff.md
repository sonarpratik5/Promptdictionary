# Prompt Dictionary — handoff

Read this file first. It is the current-state index, not a design or test log.

## Product in one sentence

A public knowledge platform for reliable AI agents, combining versioned prompts/harnesses/skills/workflows, community problem-solving, and evidence of what works—starting with coding agents. Scope and non-goals: [PRODUCT.md](PRODUCT.md).

## Current state

- **Implemented:** fixture-backed discovery and URL filters; prompt details with an honest unavailable community-action state when no persistent prompt ID exists; safe variable substitution with declared editable variables required to appear in their template; preview, copy, and share links; Supabase email/password auth boundaries with allowlisted internal return paths; submission, account contribution status with pending/error recovery for resubmission and deletion, saved-prompt listing, bookmark, feedback, and report server actions; signed-in saved/feedback action state; published-prompt and filter-facet queries with fixture fallback; responsive shared UI.
- **Configured, not live-verified:** local Supabase public configuration and a proposed SQL migration with RLS, moderation transitions, rate limits, full-text search, and keyset indexes.
- **Verified:** lint, strict TypeScript, and 75 unit tests passed on 2026-09-19, including fixture fallback for published filter facets, the submitted-variable/template binding invariant, and mocked-Supabase coverage of every mutation's authorization boundary (anonymous/tampered-ID rejection, payload correctness) in `mutations.test.ts` and `account.test.ts`. The 48-run Playwright matrix also passed (43 passed, 5 documented engine-specific skips) for anonymous fixture-backed flows, including the unavailable community-action state for fixture prompts. The default (Turbopack) production build passed on 2026-09-19 in this sandbox; a different sandbox blocked it the same day because that environment denied the Tailwind/Turbopack worker's local-port binding — treat build success as environment-dependent until confirmed against the actual deployment/CI target (FW-13). See [tests.md](tests.md).
- **Not implemented:** harness/skill/workflow/guide resource types, comments/replies, failure/evaluation records, revision history, contribution editing, moderator queue/actions, and database integration tests.
- **Not verified:** live auth, migration execution, RLS/trigger behavior, authenticated browser flows (submit/edit/bookmark/feedback/moderation), and production deployment behavior.

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
