import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCommunityPromptState, listOwnedPrompts, listSavedPrompts } from "./account";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: vi.fn() }));

const promptId = "02d7e41f-944b-482f-86c2-3f29fb4f76f4";

function chain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {
    eq: vi.fn(() => c),
    order: vi.fn(() => c),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return c;
}

function createSupabaseMock(user: { id: string } | null, resultsByTable: Record<string, { data?: unknown; error?: unknown }> = {}) {
  const from = vi.fn((table: string) => ({
    select: vi.fn(() => chain(resultsByTable[table] ?? { data: null, error: null })),
  }));
  return { auth: { getUser: vi.fn(async () => ({ data: { user } })) }, from };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listOwnedPrompts", () => {
  it("returns nothing when the project is not connected", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    await expect(listOwnedPrompts()).resolves.toEqual([]);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns nothing for an anonymous viewer", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(listOwnedPrompts()).resolves.toEqual([]);
  });

  it("maps the signed-in owner's submissions", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, {
      prompts: {
        data: [{ id: promptId, slug: "brief", title: "Clear brief", status: "pending", updated_at: "2026-09-19T00:00:00Z", rejection_reason: null }],
        error: null,
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(listOwnedPrompts()).resolves.toEqual([
      { id: promptId, slug: "brief", title: "Clear brief", status: "pending", updatedAt: "2026-09-19T00:00:00Z", rejectionReason: null },
    ]);
  });
});

describe("listSavedPrompts", () => {
  it("returns nothing when the project is not connected", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    await expect(listSavedPrompts()).resolves.toEqual([]);
  });

  it("returns nothing for an anonymous viewer", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(listSavedPrompts()).resolves.toEqual([]);
  });

  it("flattens the embedded published prompt for each bookmark", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, {
      bookmarks: {
        data: [{ prompt_id: promptId, prompts: [{ id: promptId, slug: "brief", title: "Clear brief", use_case: "Product management" }] }],
        error: null,
      },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(listSavedPrompts()).resolves.toEqual([
      { id: promptId, slug: "brief", title: "Clear brief", useCase: "Product management" },
    ]);
  });

  it("skips a bookmark whose prompt is no longer published", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, {
      bookmarks: { data: [{ prompt_id: promptId, prompts: [] }], error: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(listSavedPrompts()).resolves.toEqual([]);
  });
});

describe("getCommunityPromptState", () => {
  it("is unavailable when the project is not connected", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    await expect(getCommunityPromptState(promptId)).resolves.toEqual({ kind: "unavailable" });
  });

  it("is anonymous when no one is signed in, without exposing another viewer's state", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(getCommunityPromptState(promptId)).resolves.toEqual({ kind: "anonymous" });
  });

  it("reports the signed-in viewer's own saved and feedback state", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, {
      bookmarks: { data: { prompt_id: promptId }, error: null },
      prompt_feedback: { data: { is_helpful: true }, error: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(getCommunityPromptState(promptId)).resolves.toEqual({ kind: "authenticated", saved: true, feedback: true });
  });

  it("treats a missing row as not-saved and no-feedback rather than an error", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, {
      bookmarks: { data: null, error: null },
      prompt_feedback: { data: null, error: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(getCommunityPromptState(promptId)).resolves.toEqual({ kind: "authenticated", saved: false, feedback: null });
  });

  it("falls back to unavailable if the client throws", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(createSupabaseServerClient).mockRejectedValue(new Error("network down"));
    await expect(getCommunityPromptState(promptId)).resolves.toEqual({ kind: "unavailable" });
  });
});
