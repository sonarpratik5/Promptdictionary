import type { Prompt } from "./types";

export const prompts: Prompt[] = [
  {
    slug: "clear-product-brief",
    title: "Clear product brief",
    description: "Turn rough context into a concise, decision-ready product brief.",
    template: "Act as a pragmatic product strategist. Create a product brief for {{product_name}}.\n\nAudience: {{audience}}\nProblem: {{problem}}\n\nInclude the user outcome, scope boundaries, assumptions, and three measurable success signals. Ask concise follow-up questions if essential context is missing.",
    useCase: "Product management",
    tags: ["strategy", "planning", "writing"],
    compatibleModels: ["ChatGPT", "Claude", "Gemini"],
    testedAt: "2026-09-01",
    variables: [
      { name: "product_name", label: "Product name", description: "The product or feature to brief.", required: true },
      { name: "audience", label: "Audience", description: "Who the product is for.", required: true },
      { name: "problem", label: "Problem", description: "The concrete problem to solve.", required: true },
    ],
    limitations: "It does not validate market demand or replace customer research.",
  },
  {
    slug: "plain-language-explainer",
    title: "Plain-language explainer",
    description: "Explain a complex topic without losing the important caveats.",
    template: "Explain {{topic}} to {{reader}} in plain language. Start with a one-sentence answer, then use a concrete example. State important uncertainty or limitations plainly. Avoid jargon; define any term that cannot be avoided.",
    useCase: "Writing",
    tags: ["education", "editing", "research"],
    compatibleModels: ["ChatGPT", "Claude", "Gemini"],
    variables: [
      { name: "topic", label: "Topic", description: "The thing to explain.", required: true },
      { name: "reader", label: "Reader", description: "Knowledge level or intended audience.", defaultValue: "a curious general reader" },
    ],
    limitations: "Verify factual and high-stakes claims with primary sources.",
  },
  {
    slug: "code-review-checklist",
    title: "Code review checklist",
    description: "Get a focused review plan before changing production code.",
    template: "Review the following {{language}} change for correctness, security, accessibility, performance, and test coverage.\n\nContext: {{context}}\n\nRespond with findings ordered by severity. For each finding, explain the impact and a practical fix. Do not invent behavior not shown in the change.",
    useCase: "Development",
    tags: ["code", "review", "quality"],
    compatibleModels: ["ChatGPT", "Claude"],
    testedAt: "2026-08-22",
    variables: [
      { name: "language", label: "Language", description: "The implementation language or framework.", required: true },
      { name: "context", label: "Change context", description: "The diff, task, or relevant implementation detail.", required: true },
    ],
    limitations: "A review cannot substitute for running tests or understanding live system behavior.",
  },
];
