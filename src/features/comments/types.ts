export type CommentKind = "question" | "correction" | "failure_report" | "solution" | "general";

export type Comment = {
  id: string;
  parentId: string | null;
  authorHandle: string | null;
  authorDisplayName: string | null;
  isOwn: boolean;
  kind: CommentKind;
  body: string;
  createdAt: string;
  /** Always empty for a reply; threading is one level deep. */
  replies: Comment[];
};
