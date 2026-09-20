"use client";

import { useActionState, useState } from "react";
import { createPrompt, type PromptMutationState } from "@/features/prompts/mutations";

export function PromptSubmitForm() {
  const [state, formAction, pending] = useActionState<PromptMutationState, FormData>(createPrompt, {});
  const [variableCount, setVariableCount] = useState(0);
  return <form action={formAction} className="grid gap-6">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2" htmlFor="title">Title<input id="title" name="title" className="field font-normal" maxLength={120} required placeholder="e.g. Turn notes into an action plan" /></label>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2" htmlFor="description">What does it help with?<textarea id="description" name="description" className="field min-h-24 font-normal" maxLength={500} required /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="useCase">Use case<input id="useCase" name="useCase" className="field font-normal" maxLength={60} required placeholder="Writing, development…" /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="compatibleModels">Compatible models<span className="text-xs font-normal text-foreground-muted">One per line or comma-separated.</span><input id="compatibleModels" name="compatibleModels" className="field font-normal" required placeholder="Any model" /></label>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2" htmlFor="tags">Topics<span className="text-xs font-normal text-foreground-muted">One per line or comma-separated.</span><input id="tags" name="tags" className="field font-normal" required placeholder="planning, meetings" /></label>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2" htmlFor="template">Prompt template<span className="text-xs font-normal text-foreground-muted">Use lowercase tokens such as <code>{"{{project_name}}"}</code> for editable details.</span><textarea id="template" name="template" className="field min-h-48 font-mono text-sm" maxLength={8000} required /></label>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2" htmlFor="limitations">Known limitations<textarea id="limitations" name="limitations" className="field min-h-24 font-normal" maxLength={500} required placeholder="What should someone keep in mind?" /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="testedAt">Testing date <span className="text-xs font-normal text-foreground-muted">Optional</span><input id="testedAt" name="testedAt" type="date" className="field font-normal" /></label>
    </div>
    <fieldset className="grid gap-4 rounded-2xl border border-border bg-background-secondary p-5"><legend className="px-1 text-sm font-semibold">Editable details <span className="font-normal text-foreground-muted">Optional</span></legend>
      {Array.from({ length: variableCount }, (_, index) => <div key={index} className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">Token name<input name="variableName" className="field font-normal" placeholder="project_name" required /></label><label className="grid gap-2 text-sm font-semibold">Label<input name="variableLabel" className="field font-normal" placeholder="Project name" required /></label>
        <label className="grid gap-2 text-sm font-semibold">Description<input name="variableDescription" className="field font-normal" placeholder="What should be inserted?" required /></label><label className="grid gap-2 text-sm font-semibold">Default value<input name="variableDefault" className="field font-normal" /></label>
        <label className="flex items-center gap-2 text-sm font-medium"><input name="variableRequired" value={index} type="checkbox" className="size-4 accent-[var(--accent)]" /> Required value</label>
      </div>)}
      <button type="button" className="btn-secondary w-fit" onClick={() => setVariableCount((count) => count + 1)}>Add editable detail</button>
    </fieldset>
    <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold" htmlFor="sampleInput">Sample input <span className="text-xs font-normal text-foreground-muted">Optional; provide with output.</span><textarea id="sampleInput" name="sampleInput" className="field min-h-28 font-normal" maxLength={2000} /></label><label className="grid gap-2 text-sm font-semibold" htmlFor="sampleOutput">Sample output <span className="text-xs font-normal text-foreground-muted">Optional; provide with input.</span><textarea id="sampleOutput" name="sampleOutput" className="field min-h-28 font-normal" maxLength={2000} /></label></div>
    {state.error && <p className="alert-danger font-semibold" role="alert">{state.error}</p>}<button type="submit" disabled={pending} className="btn-primary w-fit">{pending ? "Sending for review…" : "Submit for review"}</button><p className="text-sm leading-6 text-foreground-muted">New prompts enter moderation as pending. They become public only after review.</p>
  </form>;
}
