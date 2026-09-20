import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteComment, postComment, reportComment } from "./mutations";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const promptId = "02d7e41f-944b-482f-86c2-3f29fb4f76f4";
const commentId = "b6e0e4b0-3e0a-4b9a-9c2a-8f9a5a2e5a11";

function chain(result: { error?: unknown }) {
  const c: Record<string, unknown> = { eq: vi.fn(() => c), then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) };
  return c;
}

function createSupabaseMock(user: { id: string } | null, results: Record<string, { error?: unknown }> = {}) {
  const table = { insert: vi.fn((payload: unknown) => chain(results.insert ?? { error: null })), delete: vi.fn(() => chain(results.delete ?? { error: null })) };
  const from = vi.fn(() => table);
  return { auth: { getUser: vi.fn(async () => ({ data: { user } })) }, from, table };
}

function formData(fields: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("postComment", () => {
  const validFields = { promptId, promptSlug: "brief", kind: "question", body: "Does this work?" };

  it("refuses to post when the project is not connected, before touching the database", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const result = await postComment({}, formData(validFields));
    expect(result).toEqual({ error: "Discussion is not available until the library is connected." });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects invalid input before contacting Supabase", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const result = await postComment({}, formData({ ...validFields, body: "" }));
    expect(result).toEqual({ error: expect.any(String) });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("requires a signed-in author", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await postComment({}, formData(validFields));
    expect(result).toEqual({ error: "Sign in to join the discussion." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("inserts the comment for the signed-in author", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await postComment({}, formData(validFields));
    expect(result).toEqual({ posted: true });
    expect(supabase.table.insert).toHaveBeenCalledWith({ prompt_id: promptId, parent_id: null, author_id: "user-1", kind: "question", body: "Does this work?" });
  });

  it("surfaces a database error", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, { insert: { error: { message: "rate limited" } } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await postComment({}, formData(validFields));
    expect(result).toEqual({ error: "We couldn’t post that comment." });
  });
});

describe("deleteComment", () => {
  it("rejects an anonymous caller without querying the database", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await deleteComment({}, formData({ commentId, promptSlug: "brief" }));
    expect(result).toEqual({ error: "Sign in to manage your comments." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects a tampered comment id, even when signed in", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await deleteComment({}, formData({ commentId: "not-a-uuid", promptSlug: "brief" }));
    expect(result).toEqual({ error: "Sign in to manage your comments." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("deletes only the caller's own comment", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await deleteComment({}, formData({ commentId, promptSlug: "brief" }));
    expect(result).toEqual({ deleted: true });
    const deleteChain = supabase.table.delete.mock.results[0].value;
    expect(deleteChain.eq).toHaveBeenCalledWith("id", commentId);
    expect(deleteChain.eq).toHaveBeenCalledWith("author_id", "user-1");
  });
});

describe("reportComment", () => {
  it("rejects an empty reason without contacting the database", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await reportComment({}, formData({ commentId, reason: "   " }));
    expect(result).toEqual({ error: "Tell us what needs attention in 500 characters or fewer." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("files a valid report against the comment", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await reportComment({}, formData({ commentId, reason: "Off topic." }));
    expect(result).toEqual({ reported: true });
    expect(supabase.table.insert).toHaveBeenCalledWith({ reporter_id: "user-1", comment_id: commentId, reason: "Off topic." });
  });
});
