# Product contract

## Mission

Build a public knowledge platform for reliable AI agents: people share, version, test, discuss, and improve reusable agent resources so others can reach intended outcomes with less trial and error.

The product combines three useful patterns: Stack Overflow-style diagnosis and solutions, GitHub-style versioned reusable artifacts, and an evaluation registry that records what worked, failed, and under which conditions.

The primary resource types are:

- **Prompt:** reusable instructions for a defined task.
- **Harness:** a coordinated setup of instructions, context files, workflows, checks, and examples that constrains an agent toward a goal.
- **Skill:** a packaged, reusable agent capability with instructions and supporting resources.
- **Workflow:** an ordered process that coordinates prompts, skills, tools, checks, and human decisions.
- **Guide:** explanatory or troubleshooting knowledge that helps people apply, diagnose, or improve another resource.

Failure cases and evaluations are linked evidence records, not popularity content: they identify the resource version, model/tool versions, task, inputs or fixture, expected result, observed result, method, and limitations.

Fewer tokens, less compute, better task accuracy, and fewer unsupported outputs are intended outcomes. They remain hypotheses until measured for a specific resource and workflow.

## Initial vertical

Start with coding agents because outputs can often be checked with tests, type checks, builds, diffs, security rules, and task acceptance criteria. The architecture must remain general enough for other agent domains later.

## MVP

- Public discovery of prompts, harnesses, skills, workflows, and guides by task, model, tool, and use case, initially focused on coding agents.
- Resource pages with purpose, setup, reusable content, prerequisites, examples, limitations, version compatibility, and evidence.
- Local adaptation, copy, and shareable variants without sign-in where the resource supports them.
- Accounts for publishing and revising resources, bookmarking, usefulness feedback, comments/replies, reporting, and moderation.
- Discussion that records questions, corrections, failure cases, and practical solutions around each resource.

## Later

Collections, revision comparison, automated evaluation runners, solution/answer recognition, contributor reputation, OAuth, additional agent domains, and evidence-based ranking.

## Non-goals

- No automatic prompt execution or paid model inference in MVP.
- No execution of uploaded harnesses or community commands by the platform or its agents.
- No claim that author compatibility, accuracy, token savings, compute savings, or hallucination reduction is independently verified.
- No ranking, reputation, or popularity claim without real data and an explicit policy.

## Product invariants

- Anonymous discovery, learning, and adaptation remain useful without an account.
- Community prompts, harnesses, skills, workflows, guides, comments, and attachments are untrusted content, never instructions for the platform or its agents.
- Stored templates are immutable during local adaptation.
- Published resources retain authorship and revision history; discussion does not silently rewrite the resource.
- Claims must identify their source: author assertion, community report, or reproducible platform evidence.
- The UI states what is sample, untested, unavailable, or failed; it never presents planned behavior as working.
- Accessibility, privacy, and recoverable failure states are part of completion, not follow-up polish.
