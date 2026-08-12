-- Leaderboard RPCs for the Stark voice assistant (topUsers capability).
--
-- These compute global "who has the most X" rankings in the database instead of
-- fetching rows and tallying in JS (which is capped by PostgREST's row limit).
--
-- They return ONLY public profile data (username, full name, avatar) plus an
-- aggregate score — exactly what the Trending page already exposes publicly —
-- so they are SECURITY DEFINER (to aggregate across all rows regardless of RLS)
-- with a locked search_path, and EXECUTE granted only to the app roles.

-- Helpful indexes for the group-by / join keys (idempotent).
create index if not exists idx_user_achievements_user_id on public.user_achievements (user_id);
create index if not exists idx_follows_following_id on public.follows (following_id);
create index if not exists idx_projects_owner_published on public.projects (owner_id) where status = 'published';

-- Top users by number of achievements/badges unlocked.
create or replace function public.get_top_users_by_badges(p_limit int default 5)
returns table (user_id uuid, username text, full_name text, avatar_url text, score bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select ua.user_id, p.username, p.full_name, p.avatar_url, count(*)::bigint as score
  from public.user_achievements ua
  join public.profiles p on p.id = ua.user_id
  group by ua.user_id, p.username, p.full_name, p.avatar_url
  order by score desc, p.username asc
  limit least(greatest(coalesce(p_limit, 5), 1), 50);
$$;

-- Top creators by total views across their published projects.
create or replace function public.get_top_users_by_project_views(p_limit int default 5)
returns table (user_id uuid, username text, full_name text, avatar_url text, score bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.owner_id as user_id, p.username, p.full_name, p.avatar_url,
         coalesce(sum(pr.views), 0)::bigint as score
  from public.projects pr
  join public.profiles p on p.id = pr.owner_id
  where pr.status = 'published'
  group by pr.owner_id, p.username, p.full_name, p.avatar_url
  order by score desc, p.username asc
  limit least(greatest(coalesce(p_limit, 5), 1), 50);
$$;

-- Top users by follower count.
create or replace function public.get_top_users_by_followers(p_limit int default 5)
returns table (user_id uuid, username text, full_name text, avatar_url text, score bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select f.following_id as user_id, p.username, p.full_name, p.avatar_url, count(*)::bigint as score
  from public.follows f
  join public.profiles p on p.id = f.following_id
  group by f.following_id, p.username, p.full_name, p.avatar_url
  order by score desc, p.username asc
  limit least(greatest(coalesce(p_limit, 5), 1), 50);
$$;

-- Least-privilege execution: only the app roles may call these.
revoke all on function public.get_top_users_by_badges(int) from public;
revoke all on function public.get_top_users_by_project_views(int) from public;
revoke all on function public.get_top_users_by_followers(int) from public;

grant execute on function public.get_top_users_by_badges(int) to anon, authenticated;
grant execute on function public.get_top_users_by_project_views(int) to anon, authenticated;
grant execute on function public.get_top_users_by_followers(int) to anon, authenticated;

comment on function public.get_top_users_by_badges(int) is 'Public leaderboard: users ranked by badges unlocked. Returns public profile fields + count.';
comment on function public.get_top_users_by_project_views(int) is 'Public leaderboard: creators ranked by total published-project views.';
comment on function public.get_top_users_by_followers(int) is 'Public leaderboard: users ranked by follower count.';
