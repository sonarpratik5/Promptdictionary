import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPrompt, deletePrompt, reportPrompt, resubmitPrompt, submitFeedback, toggleBookmark } from "./mutations";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

const promptId = "02d7e41f-944b-482f-86c2-3f29fb4f76f4";

type QueryResult = { data?: unknown; error?: unknown };

function chain(result: QueryResult) {
  const c: Record<string, unknown> = {
    eq: vi.fn(() => c),
    in: vi.fn(() => c),
    order: vi.fn(() => c),
    select: vi.fn(() => c),
    single: vi.fn(() => c),
    maybeSingle: vi.fn(() => c),
    then: (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return c;
}

function createSupabaseMock(user: { id: string } | null, results: QueryResult[] = []) {
  let index = 0;
  const pop = () => results[index++] ?? { data: null, error: null };
  const table = {
    insert: vi.fn(() => chain(pop())),
    update: vi.fn(() => chain(pop())),
    delete: vi.fn(() => chain(pop())),
    upsert: vi.fn(() => chain(pop())),
  };
  const from = vi.fn(() => table);
  return { auth: { getUser: vi.fn(async () => ({ data: { user } })) }, from, table };
}

const validSubmission = {
  title: "Clear product brief",
  description: "Turn rough context into a concise, decision-ready brief.",
  useCase: "Product management",
  template: "Draft a brief for {{product_name}}.",
  limitations: "Does not replace customer research.",
};

function submissionFormData() {
  const form = new FormData();
  form.set("title", validSubmission.title);
  form.set("description", validSubmission.description);
  form.set("template", validSubmission.template);
  form.set("useCase", validSubmission.useCase);
  form.set("tags", "strategy");
  form.set("compatibleModels", "Claude");
  form.set("limitations", validSubmission.limitations);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createPrompt", () => {
  it("refuses to submit when the project is not connected, before touching the database", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const result = await createPrompt({}, submissionFormData());
    expect(result).toEqual({ error: "Contributions are not available until the library is connected." });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects invalid input before contacting Supabase", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const form = submissionFormData();
    form.set("title", "");
    const result = await createPrompt({}, form);
    expect(result).toEqual({ error: expect.any(String) });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("requires a signed-in owner", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock(null);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await createPrompt({}, submissionFormData());
    expect(result).toEqual({ error: "Sign in to share a prompt with the community." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("surfaces the database error when the draft insert fails", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, [{ data: null, error: { message: "insert failed" } }]);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await createPrompt({}, submissionFormData());
    expect(result).toEqual({ error: "insert failed" });
  });

  it("tells the owner to retry from their account when the pending transition fails", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, [
      { data: { id: "draft-1" }, error: null },
      { data: null, error: { message: "update failed" } },
    ]);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const result = await createPrompt({}, submissionFormData());
    expect(result).toEqual({ error: "Your prompt was saved, but could not be sent for review. Open your account to try again." });
  });

  it("submits the draft for review and redirects on success", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, [
      { data: { id: "draft-1" }, error: null },
      { data: null, error: null },
    ]);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    await expect(createPrompt({}, submissionFormData())).rejects.toThrow("REDIRECT:/submit?submitted=1");
    expect(supabase.table.insert).toHaveBeenCalledWith(expect.objectContaining({ owner_id: "user-1", status: "draft", title: validSubmission.title }));
    expect(supabase.table.update).toHaveBeenCalledWith({ status: "pending" });
  });
});

describe("authenticated prompt actions reject anonymous and tampered requests", () => {
  const cases: Array<{ name: string; action: typeof resubmitPrompt; message: string; extraFields?: Record<string, string> }> = [
    { name: "resubmitPrompt", action: resubmitPrompt, message: "Sign in to manage your prompts." },
    { name: "deletePrompt", action: deletePrompt, message: "Sign in to manage your prompts." },
    { name: "toggleBookmark", action: toggleBookmark, message: "Sign in to save prompts.", extraFields: { saved: "true" } },
    { name: "submitFeedback", action: submitFeedback, message: "Sign in to leave feedback.", extraFields: { isHelpful: "true" } },
    { name: "reportPrompt", action: reportPrompt, message: "Sign in to report a prompt.", extraFields: { reason: "Looks broken" } },
  ];

  for (const { name, action, message, extraFields } of cases) {
    it(`${name} rejects an anonymous caller without querying the database`, async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      const supabase = createSupabaseMock(null);
      vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
      const form = new FormData();
      form.set("promptId", promptId);
      for (const [key, value] of Object.entries(extraFields ?? {})) form.set(key, value);
      const result = await action({}, form);
      expect(result).toEqual({ error: message });
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it(`${name} rejects a request with no valid prompt id, even when signed in`, async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      const supabase = createSupabaseMock({ id: "user-1" });
      vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
      const form = new FormData();
      form.set("promptId", "not-a-uuid");
      for (const [key, value] of Object.entries(extraFields ?? {})) form.set(key, value);
      const result = await action({}, form);
      expect(result).toEqual({ error: message });
      expect(supabase.from).not.toHaveBeenCalled();
    });
  }
});

describe("toggleBookmark", () => {
  it("upserts a bookmark for the signed-in user when saving", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, [{ error: null }]);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const form = new FormData();
    form.set("promptId", promptId);
    form.set("saved", "true");
    const result = await toggleBookmark({}, form);
    expect(result).toEqual({ saved: true });
    expect(supabase.from).toHaveBeenCalledWith("bookmarks");
    expect(supabase.table.upsert).toHaveBeenCalledWith({ user_id: "user-1", prompt_id: promptId });
  });

  it("deletes the bookmark when unsaving and reports a failure honestly", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, [{ error: { message: "db down" } }]);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const form = new FormData();
    form.set("promptId", promptId);
    form.set("saved", "false");
    const result = await toggleBookmark({}, form);
    expect(result).toEqual({ error: "We couldn’t update your saved prompts." });
    expect(supabase.table.delete).toHaveBeenCalled();
  });
});

describe("reportPrompt", () => {
  it("rejects an empty reason without contacting the database", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const form = new FormData();
    form.set("promptId", promptId);
    form.set("reason", "   ");
    const result = await reportPrompt({}, form);
    expect(result).toEqual({ error: "Tell us what needs attention in 500 characters or fewer." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("rejects a reason over 500 characters without contacting the database", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const form = new FormData();
    form.set("promptId", promptId);
    form.set("reason", "x".repeat(501));
    const result = await reportPrompt({}, form);
    expect(result).toEqual({ error: "Tell us what needs attention in 500 characters or fewer." });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("files a valid report for the signed-in reporter", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, [{ error: null }]);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const form = new FormData();
    form.set("promptId", promptId);
    form.set("reason", "This template leaks a placeholder.");
    const result = await reportPrompt({}, form);
    expect(result).toEqual({ reported: true });
    expect(supabase.table.insert).toHaveBeenCalledWith({ reporter_id: "user-1", prompt_id: promptId, reason: "This template leaks a placeholder." });
  });
});

describe("resubmitPrompt and deletePrompt", () => {
  it("resubmitPrompt only targets the caller's own draft or rejected prompt", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, [{ error: null }]);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const form = new FormData();
    form.set("promptId", promptId);
    await expect(resubmitPrompt({}, form)).rejects.toThrow("REDIRECT:/account?updated=1");
    expect(supabase.table.update).toHaveBeenCalledWith({ status: "pending", rejection_reason: null });
    const updateChain = supabase.table.update.mock.results[0].value;
    expect(updateChain.eq).toHaveBeenCalledWith("id", promptId);
    expect(updateChain.eq).toHaveBeenCalledWith("owner_id", "user-1");
    expect(updateChain.in).toHaveBeenCalledWith("status", ["draft", "rejected"]);
  });

  it("deletePrompt reports failure without redirecting", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const supabase = createSupabaseMock({ id: "user-1" }, [{ error: { message: "blocked" } }]);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    const form = new FormData();
    form.set("promptId", promptId);
    const result = await deletePrompt({}, form);
    expect(result).toEqual({ error: "We couldn’t delete that draft." });
  });
});
