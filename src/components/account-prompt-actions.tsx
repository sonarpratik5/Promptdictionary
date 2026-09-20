"use client";

import { useActionState } from "react";
import { deletePrompt, resubmitPrompt, type PromptMutationState } from "@/features/prompts/mutations";

export function AccountPromptActions({ promptId, canResubmit, canDelete }: { promptId: string; canResubmit: boolean; canDelete: boolean }) {
  const [resubmitState, resubmitAction, resubmitPending] = useActionState<PromptMutationState, FormData>(resubmitPrompt, {});
  const [deleteState, deleteAction, deletePending] = useActionState<PromptMutationState, FormData>(deletePrompt, {});

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {canResubmit ? <form action={resubmitAction}><input type="hidden" name="promptId" value={promptId} /><button className="btn-primary" type="submit" disabled={resubmitPending}>{resubmitPending ? "Sending…" : "Send for review"}</button></form> : null}
      {canDelete ? <form action={deleteAction}><input type="hidden" name="promptId" value={promptId} /><button className="btn-secondary" type="submit" disabled={deletePending}>{deletePending ? "Deleting…" : "Delete draft"}</button></form> : null}
      {resubmitState.error ? <p className="text-sm text-danger" role="alert">{resubmitState.error}</p> : null}
      {deleteState.error ? <p className="text-sm text-danger" role="alert">{deleteState.error}</p> : null}
    </div>
  );
}
