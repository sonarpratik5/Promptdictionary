import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateProfile } from "./mutations";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function createSupabaseMock(user: { id: string } | null, upsertResult: { error?: unknown } = { error: null }) {
  const upsert = vi.fn(() => Promise.resolve(upsertResult));
  const from = vi.fn(() => ({ upsert }));
  return { auth: { getUser: vi.fn(async () => ({ data: { user } })) }, from, upsert };
}

function formData(fields: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateProfile", () => {
  it("refuses to save when the project is not connected, before touching the database", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const result = await updateProfile({}, formData({ handle: "ada", displayName: "Ada" }));
    expect(result).toEqual({ error: "Profiles are not available until the library is connected." });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects invalid input before contacting Supabase", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const result = await updateProfile({}, formData({ handle: "a", displayName: "Ada" }));
    expect(result).toEqual({ error: expect.any(String) });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("requires a signed-in viewer", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await updateProfile({}, formData({ handle: "ada", displayName: "Ada" }));
    expect(result).toEqual({ error: "Sign in to edit your profile." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("upserts the profile for the signed-in viewer", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await updateProfile({}, formData({ handle: "Ada-Lovelace", displayName: "Ada", bio: "Hi" }));
    expect(result).toEqual({ saved: true });
    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(supabase.upsert).toHaveBeenCalledWith({ user_id: "user-1", handle: "ada-lovelace", display_name: "Ada", bio: "Hi" });
  });

  it("reports a friendly error when the handle is already taken", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, { error: { code: "23505", message: "duplicate key" } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await updateProfile({}, formData({ handle: "ada", displayName: "Ada" }));
    expect(result).toEqual({ error: "That handle is already taken." });
  });

  it("surfaces a generic error for other database failures", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, { error: { message: "down" } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await updateProfile({}, formData({ handle: "ada", displayName: "Ada" }));
    expect(result).toEqual({ error: "We couldn’t save your profile." });
  });
});
