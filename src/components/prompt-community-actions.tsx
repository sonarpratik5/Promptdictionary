"use client";

import { useActionState } from "react";
import { reportPrompt, submitFeedback, toggleBookmark, type PromptMutationState } from "@/features/prompts/mutations";

export function PromptCommunityActionForms({ promptId, initialSaved, initialFeedback }: { promptId: string; initialSaved: boolean; initialFeedback: boolean | null }) {
  const [feedback, feedbackAction, feedbackPending] = useActionState<PromptMutationState, FormData>(submitFeedback, {});
  const [report, reportAction, reportPending] = useActionState<PromptMutationState, FormData>(reportPrompt, {});
  const [bookmark, bookmarkAction, bookmarkPending] = useActionState<PromptMutationState, FormData>(toggleBookmark, {});
  const saved = bookmark.saved ?? initialSaved;
  const currentFeedback = feedback.feedback ?? initialFeedback;
  return <>
    <div className="flex flex-wrap items-center gap-3"><form action={bookmarkAction}><input type="hidden" name="promptId" value={promptId} /><input type="hidden" name="saved" value={String(!saved)} /><button className="btn-secondary" disabled={bookmarkPending}>{bookmarkPending ? "Updating…" : saved ? "Remove saved prompt" : "Save prompt"}</button></form>{bookmark.error && <span className="text-sm text-danger" role="alert">{bookmark.error}</span>}</div>
    <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-foreground-muted">Was this prompt useful?</span><form action={feedbackAction}><input type="hidden" name="promptId" value={promptId} /><input type="hidden" name="isHelpful" value="true" /><button className="btn-secondary" disabled={feedbackPending} aria-pressed={currentFeedback === true}>Yes</button></form><form action={feedbackAction}><input type="hidden" name="promptId" value={promptId} /><input type="hidden" name="isHelpful" value="false" /><button className="btn-secondary" disabled={feedbackPending} aria-pressed={currentFeedback === false}>Not yet</button></form>{feedback.error && <span className="text-sm text-danger" role="alert">{feedback.error}</span>}</div>
    <form action={reportAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><input type="hidden" name="promptId" value={promptId} /><label className="grid gap-2 text-sm font-semibold" htmlFor="report-reason">See a problem? <span className="text-xs font-normal text-foreground-muted">Report it privately for review.</span><textarea id="report-reason" name="reason" className="field min-h-20 font-normal" maxLength={500} required placeholder="What should a moderator look at?" /></label><button className="btn-secondary" disabled={reportPending}>{reportPending ? "Sending…" : "Report prompt"}</button></form>
    {report.error ? <p className="text-sm text-danger" role="alert">{report.error}</p> : report.reported ? <p className="text-sm text-foreground-muted" role="status">Report sent for moderator review.</p> : null}
  </>;
}
