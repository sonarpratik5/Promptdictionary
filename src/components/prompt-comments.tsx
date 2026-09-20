"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteComment, postComment, reportComment, type CommentMutationState } from "@/features/comments/mutations";
import type { Comment, CommentKind } from "@/features/comments/types";

const kindLabel: Record<CommentKind, string> = {
  question: "Question",
  correction: "Correction",
  failure_report: "Failure report",
  solution: "Solution",
  general: "General",
};
const kindOptions: CommentKind[] = ["question", "correction", "failure_report", "solution", "general"];

/**
 * Next.js re-renders the prompt page's server tree after each action
 * revalidates it (see app/guides/server-actions.md), so this form never
 * copies `comments` into local state — the fresh list arrives as a prop.
 * `key` forces a remount (clearing the uncontrolled inputs) once the count
 * it is keyed on changes.
 */
function CommentComposer({ promptId, promptSlug, parentId, onCancel }: { promptId: string; promptSlug: string; parentId?: string; onCancel?: () => void }) {
  const [state, action, pending] = useActionState<CommentMutationState, FormData>(postComment, {});
  return (
    <form action={action} className="grid gap-3 rounded-xl border border-border bg-background-secondary p-4">
      <input type="hidden" name="promptId" value={promptId} />
      <input type="hidden" name="promptSlug" value={promptSlug} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      {parentId
        ? <input type="hidden" name="kind" value="general" />
        : <label className="grid gap-1 text-sm font-semibold" htmlFor={`kind-${promptId}`}>Type<select id={`kind-${promptId}`} name="kind" className="field font-normal" defaultValue="question">{kindOptions.map((kind) => <option key={kind} value={kind}>{kindLabel[kind]}</option>)}</select></label>}
      <label className="grid gap-1 text-sm font-semibold" htmlFor={`body-${parentId ?? "root"}-${promptId}`}>{parentId ? "Reply" : "Add to the discussion"}<textarea id={`body-${parentId ?? "root"}-${promptId}`} name="body" className="field min-h-20 font-normal" maxLength={4000} required /></label>
      <div className="flex items-center gap-3">
        <button className="btn-secondary w-fit" disabled={pending}>{pending ? "Posting…" : "Post"}</button>
        {onCancel && <button type="button" className="text-sm text-foreground-muted hover:text-foreground" onClick={onCancel}>Cancel</button>}
      </div>
      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
    </form>
  );
}

function CommentRow({ comment, promptId, promptSlug, canInteract }: { comment: Comment; promptId: string; promptSlug: string; canInteract: boolean }) {
  const [deleteState, deleteAction, deletePending] = useActionState<CommentMutationState, FormData>(deleteComment, {});
  const [reportState, reportAction, reportPending] = useActionState<CommentMutationState, FormData>(reportComment, {});
  const [replying, setReplying] = useState(false);
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {comment.authorHandle ? <Link href={`/u/${comment.authorHandle}`} className="hover:text-accent">{comment.authorDisplayName ?? comment.authorHandle}</Link> : <span>Member</span>}
          <span className="pill-tag ml-2 align-middle">{kindLabel[comment.kind]}</span>
        </p>
        <time className="text-xs text-foreground-muted" dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString()}</time>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground-muted">{comment.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
        {canInteract && !comment.parentId && <button type="button" className="font-semibold text-accent" onClick={() => setReplying((value) => !value)}>{replying ? "Cancel reply" : "Reply"}</button>}
        {comment.isOwn
          ? <form action={deleteAction}><input type="hidden" name="commentId" value={comment.id} /><input type="hidden" name="promptSlug" value={promptSlug} /><button className="font-semibold text-danger" disabled={deletePending}>{deletePending ? "Deleting…" : "Delete"}</button></form>
          : canInteract && (reportState.reported
            ? <span className="text-foreground-muted">Reported</span>
            : <form action={reportAction}><input type="hidden" name="commentId" value={comment.id} /><input type="hidden" name="reason" value="Flagged from the prompt discussion." /><button className="font-semibold text-foreground-muted hover:text-danger" disabled={reportPending}>Report</button></form>)}
      </div>
      {deleteState.error && <p className="mt-1 text-xs text-danger" role="alert">{deleteState.error}</p>}
      {reportState.error && <p className="mt-1 text-xs text-danger" role="alert">{reportState.error}</p>}
      {replying && <div className="mt-3"><CommentComposer key={comment.replies.length} promptId={promptId} promptSlug={promptSlug} parentId={comment.id} onCancel={() => setReplying(false)} /></div>}
      {comment.replies.length > 0 && <ul className="mt-4 grid gap-3 border-l-2 border-border pl-4">{comment.replies.map((reply) => <CommentRow key={reply.id} comment={reply} promptId={promptId} promptSlug={promptSlug} canInteract={canInteract} />)}</ul>}
    </li>
  );
}

export function PromptComments({ promptId, promptSlug, comments, canInteract }: { promptId: string; promptSlug: string; comments: Comment[]; canInteract: boolean }) {
  return (
    <section className="mt-10 grid gap-5 border-t border-border pt-8" aria-labelledby="discussion-heading">
      <h2 id="discussion-heading" className="text-xl font-semibold">Discussion</h2>
      <p className="text-sm leading-6 text-foreground-muted">Ask questions, flag corrections, report failures, or share a working solution. Comments never change the prompt above.</p>
      {canInteract
        ? <CommentComposer key={comments.length} promptId={promptId} promptSlug={promptSlug} />
        : <p className="text-sm leading-6 text-foreground-muted"><Link href={`/auth?next=${encodeURIComponent(`/prompts/${promptSlug}`)}`} className="font-semibold text-accent underline-offset-4 hover:underline">Sign in</Link> to join the discussion.</p>}
      {comments.length === 0
        ? <p className="text-sm text-foreground-muted">No discussion yet.</p>
        : <ul className="grid gap-3">{comments.map((comment) => <CommentRow key={comment.id} comment={comment} promptId={promptId} promptSlug={promptSlug} canInteract={canInteract} />)}</ul>}
    </section>
  );
}
