-- Prompt Dictionary: prompts, moderation, bookmarks, feedback, and reports.
-- Encodes the decisions recorded in architecture.md ("Resolved decisions").
-- Proposed schema: authored but not yet run against a live Supabase project;
-- see tests.md for verification status before relying on it.

create extension if not exists "pgcrypto";

-- Moderators ----------------------------------------------------------
-- Membership in this table, not a role column, is what makes someone a
-- moderator. That keeps every check a plain EXISTS and keeps granting the
-- role a manual admin action: there is deliberately no insert policy below,
-- so only a service-role connection (e.g. the Supabase dashboard/CLI) can
-- add a row.

create table public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.moderators enable row level security;

create policy "moderators read own membership"
  on public.moderators for select
  using (user_id = auth.uid());

create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.moderators where user_id = uid);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Prompts ---------------------------------------------------------------

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 500),
  template text not null check (char_length(template) between 1 and 8000),
  use_case text not null check (char_length(use_case) between 1 and 60),
  tags text[] not null default '{}',
  compatible_models text[] not null default '{}',
  variables jsonb not null default '[]'::jsonb,
  limitations text not null check (char_length(limitations) between 1 and 500),
  tested_at date,
  sample_input text check (sample_input is null or char_length(sample_input) <= 2000),
  sample_output text check (sample_output is null or char_length(sample_output) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'pending', 'published', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint prompts_at_least_one_tag check (cardinality(tags) >= 1),
  constraint prompts_at_least_one_model check (cardinality(compatible_models) >= 1),
  constraint prompts_sample_pairing check ((sample_input is null) = (sample_output is null))
);

-- Keyset pagination (created_at/published_at + id) avoids the duplicate/
-- skipped rows that offset pagination can produce when new prompts are
-- published between page requests.
create index prompts_published_keyset_idx
  on public.prompts (published_at desc, id)
  where status = 'published';

create index prompts_owner_idx on public.prompts (owner_id);

create index prompts_search_idx on public.prompts using gin (
  to_tsvector(
    'english',
    title || ' ' || description || ' ' || use_case || ' ' || array_to_string(tags, ' ')
  )
);

create trigger prompts_set_updated_at
  before update on public.prompts
  for each row execute function public.set_updated_at();

-- Only a moderator may move a prompt into or out of "published"/"rejected".
-- An owner's edit to an already-published prompt is allowed but returns it
-- to "pending" so an unreviewed change is never shown to the public as
-- already approved.
create or replace function public.enforce_prompt_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('published', 'rejected')
     and not public.is_moderator(auth.uid()) then
    raise exception 'Only moderators may publish or reject a prompt.';
  end if;

  if old.status = 'published'
     and new.status = 'published'
     and not public.is_moderator(auth.uid())
     and (
       new.title is distinct from old.title or
       new.description is distinct from old.description or
       new.template is distinct from old.template or
       new.use_case is distinct from old.use_case or
       new.tags is distinct from old.tags or
       new.compatible_models is distinct from old.compatible_models or
       new.variables is distinct from old.variables or
       new.limitations is distinct from old.limitations or
       new.sample_input is distinct from old.sample_input or
       new.sample_output is distinct from old.sample_output
     ) then
    new.status := 'pending';
    new.rejection_reason := null;
  end if;

  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at := now();
  end if;

  return new;
end;
$$;

create trigger prompts_enforce_status_transition
  before update on public.prompts
  for each row execute function public.enforce_prompt_status_transition();

-- A submitter may open at most 20 prompts in a rolling 24 hours, keeping the
-- moderation queue boundable without blocking normal contribution.
create or replace function public.enforce_prompt_submission_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.prompts
  where owner_id = new.owner_id
    and created_at > now() - interval '24 hours';

  if recent_count >= 20 then
    raise exception 'Submission limit reached: at most 20 prompts per 24 hours.';
  end if;

  return new;
end;
$$;

create trigger prompts_enforce_submission_rate_limit
  before insert on public.prompts
  for each row execute function public.enforce_prompt_submission_rate_limit();

alter table public.prompts enable row level security;

create policy "read published or own prompts"
  on public.prompts for select
  using (status = 'published' or owner_id = auth.uid() or public.is_moderator(auth.uid()));

create policy "insert own draft prompt"
  on public.prompts for insert
  with check (owner_id = auth.uid() and status = 'draft');

create policy "update own or moderated prompt"
  on public.prompts for update
  using (owner_id = auth.uid() or public.is_moderator(auth.uid()))
  with check (owner_id = auth.uid() or public.is_moderator(auth.uid()));

create policy "delete own unpublished prompt"
  on public.prompts for delete
  using (owner_id = auth.uid() and status in ('draft', 'rejected'));

-- Bookmarks ---------------------------------------------------------------

create table public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

alter table public.bookmarks enable row level security;

create policy "read own bookmarks"
  on public.bookmarks for select
  using (user_id = auth.uid());

create policy "write own bookmarks"
  on public.bookmarks for insert
  with check (user_id = auth.uid());

create policy "delete own bookmarks"
  on public.bookmarks for delete
  using (user_id = auth.uid());

-- Feedback ------------------------------------------------------------
-- Binary "was this useful", one row per user/prompt, upserted on conflict.
-- Simpler than a star scale while there is no reviewer volume yet, and it
-- keeps the uniqueness constraint (and its abuse resistance) trivial.

create table public.prompt_feedback (
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  is_helpful boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

create trigger prompt_feedback_set_updated_at
  before update on public.prompt_feedback
  for each row execute function public.set_updated_at();

alter table public.prompt_feedback enable row level security;

create policy "read own feedback"
  on public.prompt_feedback for select
  using (user_id = auth.uid());

create policy "write own feedback"
  on public.prompt_feedback for insert
  with check (user_id = auth.uid());

create policy "update own feedback"
  on public.prompt_feedback for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "delete own feedback"
  on public.prompt_feedback for delete
  using (user_id = auth.uid());

-- Reports -----------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references auth.users (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at);

-- A reporter may file at most 10 reports in a rolling 24 hours.
create or replace function public.enforce_report_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.reports
  where reporter_id = new.reporter_id
    and created_at > now() - interval '24 hours';

  if recent_count >= 10 then
    raise exception 'Report limit reached: at most 10 reports per 24 hours.';
  end if;

  return new;
end;
$$;

create trigger reports_enforce_rate_limit
  before insert on public.reports
  for each row execute function public.enforce_report_rate_limit();

alter table public.reports enable row level security;

create policy "read own or moderated reports"
  on public.reports for select
  using (reporter_id = auth.uid() or public.is_moderator(auth.uid()));

create policy "file a report"
  on public.reports for insert
  with check (reporter_id = auth.uid());

create policy "moderators resolve reports"
  on public.reports for update
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));
