-- Co-organisers for a contest.
--
-- A contest had exactly one person who could reach its dashboard: whoever
-- created it. On anything the size of the hackathon that's a bottleneck —
-- nobody else can post an announcement, manage judges or watch
-- submissions without the creator's own login.
--
-- Deliberately narrower than ownership. A moderator gets the dashboard;
-- deleting the contest and managing the moderator list stay with the
-- creator, so handing someone a seat can always be undone by the person
-- who handed it over.
create table if not exists public.contest_moderators (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  -- One seat per person per contest; re-adding someone is a no-op rather
  -- than a second row (the same duplicate-invite problem collaborations hit).
  unique (contest_id, user_id)
);

create index if not exists contest_moderators_contest_id_idx on public.contest_moderators(contest_id);
create index if not exists contest_moderators_user_id_idx on public.contest_moderators(user_id);

alter table public.contest_moderators enable row level security;

-- Readable by the contest's creator and by the moderators themselves, so a
-- moderator can tell they still have access. All writes go through server
-- actions using the service role, which check the caller is the creator —
-- no client-side insert or delete policy on purpose.
drop policy if exists "contest moderators are visible to the contest team" on public.contest_moderators;
create policy "contest moderators are visible to the contest team"
  on public.contest_moderators
  for select
  using (
    auth.uid() = user_id
    or auth.uid() = (select creator_id from public.contests c where c.id = contest_id)
  );
