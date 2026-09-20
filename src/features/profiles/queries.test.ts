import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOwnProfile, getPublicProfile, listPublishedPromptsByOwner } from "./queries";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: vi.fn() }));

const userId = "02d7e41f-944b-482f-86c2-3f29fb4f76f4";

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
  const from = vi.fn((table: string) => ({ select: vi.fn(() => chain(resultsByTable[table] ?? { data: null, error: null })) }));
  return { auth: { getUser: vi.fn(async () => ({ data: { user } })) }, from };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getOwnProfile", () => {
  it("is null when the project is not connected", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    await expect(getOwnProfile()).resolves.toBeNull();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("is null for an anonymous viewer", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(getOwnProfile()).resolves.toBeNull();
  });

  it("maps the signed-in viewer's own row", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: userId }, {
      profiles: { data: { user_id: userId, handle: "ada", display_name: "Ada", bio: null }, error: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(getOwnProfile()).resolves.toEqual({ userId, handle: "ada", displayName: "Ada", bio: null });
  });
});

describe("getPublicProfile", () => {
  it("is null when the project is not connected", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    await expect(getPublicProfile("ada")).resolves.toBeNull();
  });

  it("is null for an empty handle without contacting the database", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    await expect(getPublicProfile("")).resolves.toBeNull();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns the matching profile", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null, {
      profiles: { data: { user_id: userId, handle: "ada", display_name: "Ada", bio: "Bio" }, error: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(getPublicProfile("ada")).resolves.toEqual({ userId, handle: "ada", displayName: "Ada", bio: "Bio" });
  });

  it("is null when no profile matches", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null, { profiles: { data: null, error: null } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(getPublicProfile("nobody")).resolves.toBeNull();
  });

  it("falls back to null if the client throws", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(createSupabaseServerClient).mockRejectedValue(new Error("network down"));
    await expect(getPublicProfile("ada")).resolves.toBeNull();
  });
});

describe("listPublishedPromptsByOwner", () => {
  it("returns nothing when the project is not connected", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    await expect(listPublishedPromptsByOwner(userId)).resolves.toEqual([]);
  });

  it("maps the owner's published prompts", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null, {
      prompts: { data: [{ id: "p1", slug: "brief", title: "Clear brief", use_case: "Product management" }], error: null },
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(listPublishedPromptsByOwner(userId)).resolves.toEqual([{ id: "p1", slug: "brief", title: "Clear brief", useCase: "Product management" }]);
  });

  it("returns nothing on a database error", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null, { prompts: { data: null, error: { message: "down" } } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(listPublishedPromptsByOwner(userId)).resolves.toEqual([]);
  });
});
