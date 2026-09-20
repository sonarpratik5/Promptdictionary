# Future work

This is the only backlog. Architecture decisions belong in [architecture.md](architecture.md); verification evidence belongs in [tests.md](tests.md).

States: `READY`, `BLOCKED`, `IN PROGRESS`. Completed work is removed after `Handoff.md` and `tests.md` are updated.

## Now

| ID | State | Outcome / completion gate | Depends on |
| --- | --- | --- | --- |
| FW-03 | BLOCKED | Verify registration, confirmation, sign-in/out, recovery, and production callback allowlist against non-production Supabase. | Restarted app with project config; dashboard access |
| FW-04 | BLOCKED | Apply the SQL migration and integration-test constraints, triggers, search, and RLS as anonymous/owner/other/moderator. | Non-production Supabase; FW-03 |
| FW-05 | BLOCKED | Generate and adopt `src/lib/supabase/database.types.ts`. | Applied migration; Supabase CLI/project access |

## Next

| ID | State | Outcome / completion gate | Depends on |
| --- | --- | --- | --- |
| FW-06 | BLOCKED | Design and migrate the versioned resource model for prompts, harnesses, skills, workflows, and guides without losing current prompt data. | Verified base migration; FW-04, FW-05 |
| FW-07 | BLOCKED | Add resource editing/revisions with published material changes returning to `pending`. | FW-06 |
| FW-08 | BLOCKED | Add comments/replies for questions, corrections, failure cases, and solutions with ownership, rate limits, reporting, and moderation. | FW-06 |
| FW-09 | BLOCKED | Add type-aware harness, skill, workflow, and guide submission/detail experiences, including setup, prerequisites, checks, evidence, and limitations. | FW-06, FW-07 |
| FW-10 | BLOCKED | Add moderator queue/actions for resources and discussion. | FW-06, FW-08 |
| FW-11 | BLOCKED | Verify the implemented saved-prompt listing and account empty/error states against the migrated, typed Supabase schema. | FW-04, FW-05 |
| FW-12 | IN PROGRESS | Automate the highest-risk authenticated flows (submit, edit, bookmark, feedback, moderation) now that Playwright is configured and the anonymous fixture-backed flows (discovery/filter, back/forward, adapt/copy/share, share-link hydration, keyboard/skip-link, mobile/tablet/desktop overflow, 200% zoom, reduced motion) are automated across chromium/firefox/webkit in `tests/e2e/` — see [tests.md](tests.md). | Test users/non-production Supabase (FW-03, FW-04) |
| FW-13 | BLOCKED | Verify Netlify environment variables, Supabase redirect URL, and deployment smoke behavior. | Deployment/dashboard access; FW-03 |
| FW-14 | BLOCKED | Add version-bound failure/evaluation records for coding agents with fixtures, expected/observed results, model/tool versions, metrics, and evidence tier. | FW-06, FW-07 |

## Later

- Decide page size and rate-limit/backoff UX from observed usage.
- Add collections, revision comparison UI, automated evaluation runners, solution recognition, and additional agent domains only after platform persistence/moderation is reliable.
- Measure task success, retries, tokens, latency, and estimated compute with explicit baselines before promoting efficiency or accuracy claims.
- Finalize brand tokens; assess dark mode as a complete accessible system.
- Collect real performance and usability evidence before making improvement claims.

## Maintenance

Each item must describe an outcome and its completion evidence. Update state/dependencies in place; do not add session notes. When work reveals a durable contract, update `architecture.md`; when a check runs, update `tests.md`; when current capability changes, update `Handoff.md`.
