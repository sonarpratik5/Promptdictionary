import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listCommentsForPrompt } from "./queries";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: vi.fn() }));

const promptId = "02d7e41f-944b-482f-86c2-3f29fb4f76f4";

function createSupabaseMock(user: { id: string } | null, result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {
    eq: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve(result)),
  };
  const from = vi.fn(() => ({ select: vi.fn(() => chain) }));
  return { auth: { getUser: vi.fn(async () => ({ data: { user } })) }, from };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listCommentsForPrompt", () => {
  it("returns nothing when the project is not connected", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    await expect(listCommentsForPrompt(promptId)).resolves.toEqual([]);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns nothing on a database error", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null, { data: null, error: { message: "down" } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(listCommentsForPrompt(promptId)).resolves.toEqual([]);
  });

  it("nests a reply under its top-level comment and marks the viewer's own comment", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const rows = [
      { id: "c1", parent_id: null, author_id: "user-1", kind: "question", body: "Does this work?", created_at: "2026-09-19T00:00:00Z", profiles: { handle: "ada", display_name: "Ada" } },
      { id: "c2", parent_id: "c1", author_id: "user-2", kind: "general", body: "Yes.", created_at: "2026-09-19T01:00:00Z", profiles: { handle: "grace", display_name: "Grace" } },
    ];
    const supabase = createSupabaseMock({ id: "user-1" }, { data: rows, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await listCommentsForPrompt(promptId);
    expect(result).toEqual([
      {
        id: "c1", parentId: null, authorHandle: "ada", authorDisplayName: "Ada", isOwn: true, kind: "question", body: "Does this work?", createdAt: "2026-09-19T00:00:00Z",
        replies: [{ id: "c2", parentId: "c1", authorHandle: "grace", authorDisplayName: "Grace", isOwn: false, kind: "general", body: "Yes.", createdAt: "2026-09-19T01:00:00Z", replies: [] }],
      },
    ]);
  });

  it("treats a missing author profile as anonymous rather than failing", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const rows = [{ id: "c1", parent_id: null, author_id: "user-1", kind: "general", body: "Hi", created_at: "2026-09-19T00:00:00Z", profiles: null }];
    const supabase = createSupabaseMock(null, { data: rows, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await listCommentsForPrompt(promptId);
    expect(result[0]).toEqual(expect.objectContaining({ authorHandle: null, authorDisplayName: null, isOwn: false }));
  });

  it("falls back to an empty list if the client throws", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(createSupabaseServerClient).mockRejectedValue(new Error("network down"));
    await expect(listCommentsForPrompt(promptId)).resolves.toEqual([]);
  });
});
