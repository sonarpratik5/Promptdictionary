-- Prompt Dictionary: public profiles and per-prompt discussion (comments).
-- Extends 20260912200000_prompts_schema.sql; run after it. Proposed schema:
-- authored but not yet run against a live Supabase project; see tests.md for
-- verification status before relying on it.
--
-- Scope: this covers discussion on prompts only. architecture.md's Forum
-- resource contract calls for comments on every resource type (harnesses,
-- skills, workflows, guides); that generalization waits for FW-06's
-- normalized resource model so comments are not modeled twice.

-- Profiles ------------------------------------------------------------
-- One public identity per account. `set_updated_at` and `is_moderator`
-- already exist from the base migration.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9][a-z0-9_-]{1,29}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text check (bio is null or char_length(bio) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Author identity is public by product design (architecture.md: "Published
-- resources retain authorship"), so profiles are readable by anyone.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "insert own profile"
  on public.profiles for insert
  with check (user_id = auth.uid());

create policy "update own profile"
  on public.profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Every account gets a default profile at signup so a handle always exists
-- for author links and comments; the account page lets the owner change it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
begin
  base := regexp_replace(lower(split_part(coalesce(new.email, 'user'), '@', 1)), '[^a-z0-9_-]', '', 'g');
  if base = '' or char_length(base) < 2 then base := 'member'; end if;
  base := left(base, 20);
  candidate := base || '-' || left(replace(new.id::text, '-', ''), 8);
  insert into public.profiles (user_id, handle, display_name)
  values (new.id, candidate, base)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Comments --------------------------------------------------------------
-- Threaded one level deep (a top-level comment plus direct replies); this
-- keeps rendering and moderation simple until real usage asks for more.
-- Comments never modify the prompt they discuss (architecture.md).

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'general' check (kind in ('question', 'correction', 'failure_report', 'solution', 'general')),
  body text not null check (char_length(body) between 1 and 4000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create index comments_prompt_idx on public.comments (prompt_id, created_at);
create index comments_parent_idx on public.comments (parent_id);

create or replace function public.enforce_comment_depth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  grandparent_id uuid;
begin
  if new.parent_id is not null then
    select parent_id into grandparent_id from public.comments where id = new.parent_id;
    if not found then
      raise exception 'Reply target does not exist.';
    end if;
    if grandparent_id is not null then
      raise exception 'Replies can only be made to a top-level comment.';
    end if;
  end if;
  return new;
end;
$$;

create trigger comments_enforce_depth
  before insert on public.comments
  for each row execute function public.enforce_comment_depth();

-- A commenter may post at most 30 comments in a rolling 24 hours.
create or replace function public.enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  perform pg_advisory_xact_lock(3, hashtext(new.author_id::text));
  select count(*) into recent_count
  from public.comments
  where author_id = new.author_id
    and created_at > now() - interval '24 hours';
  if recent_count >= 30 then
    raise exception 'Comment limit reached: at most 30 comments per 24 hours.';
  end if;
  return new;
end;
$$;

create trigger comments_enforce_rate_limit
  before insert on public.comments
  for each row execute function public.enforce_comment_rate_limit();

alter table public.comments enable row level security;

create policy "read visible comments on readable prompts"
  on public.comments for select
  using (
    (
      status = 'visible'
      and exists (
        select 1 from public.prompts
        where prompts.id = comments.prompt_id
          and (prompts.status = 'published' or prompts.owner_id = auth.uid() or public.is_moderator(auth.uid()))
      )
    )
    or author_id = auth.uid()
    or public.is_moderator(auth.uid())
  );

create policy "post own comment"
  on public.comments for insert
  with check (author_id = auth.uid());

create policy "delete own or moderated comment"
  on public.comments for delete
  using (author_id = auth.uid() or public.is_moderator(auth.uid()));

create policy "moderators hide comments"
  on public.comments for update
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));

-- Reports: extend to cover comments -------------------------------------
-- A report now targets exactly one of a prompt or a comment; the existing
-- rate-limit trigger is per-reporter, not per-target, so it already covers
-- comment reports without change.

alter table public.reports
  alter column prompt_id drop not null,
  add column comment_id uuid references public.comments (id) on delete cascade,
  add constraint reports_target_exactly_one check (
    (prompt_id is not null and comment_id is null) or (prompt_id is null and comment_id is not null)
  );

create index reports_comment_idx on public.reports (comment_id);
