-- Stash: Row Level Security, read views and RPC functions.

-- ---------------------------------------------------------------------------
-- RLS: enabled on every table
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.cards enable row level security;
alter table public.profiles enable row level security;
alter table public.stashes enable row level security;
alter table public.card_reviews enable row level security;
alter table public.card_views enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.ingestion_queries enable row level security;

-- Public catalogue: readable by everyone, writable only by the service role
-- (the service role bypasses RLS, so no write policy is defined).
create policy "categories are public" on public.categories
  for select to anon, authenticated using (true);

create policy "books are public" on public.books
  for select to anon, authenticated using (true);

create policy "published cards are public" on public.cards
  for select to anon, authenticated using (status = 'published');

revoke insert, update, delete on public.categories, public.books, public.cards from anon, authenticated;
revoke all on public.ingestion_runs, public.ingestion_queries from anon, authenticated;

-- Profiles: each user reads and edits only their own row.
create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Streak columns are maintained by record_activity() only.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, interests, daily_goal, language, onboarded) on public.profiles to authenticated;

-- Stashes
create policy "read own stashes" on public.stashes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own stashes" on public.stashes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own stashes" on public.stashes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "delete own stashes" on public.stashes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Reviews
create policy "read own reviews" on public.card_reviews
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own reviews" on public.card_reviews
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own reviews" on public.card_reviews
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "delete own reviews" on public.card_reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Views (append-only log)
create policy "read own views" on public.card_views
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own views" on public.card_views
  for insert to authenticated with check ((select auth.uid()) = user_id);
revoke update, delete on public.card_views from anon, authenticated;

-- ---------------------------------------------------------------------------
-- card_details: cards joined with their category and book.
-- security_invoker keeps the RLS of the underlying tables.
-- ---------------------------------------------------------------------------
create view public.card_details
with (security_invoker = true)
as
select
  c.id,
  c.category_id,
  coalesce(cat.parent_id, cat.id) as main_category_id,
  cat.slug as category_slug,
  cat.name_fr as category_name_fr,
  cat.name_en as category_name_en,
  coalesce(parent.icon, cat.icon) as category_icon,
  c.book_id,
  b.title as book_title,
  b.author as book_author,
  b.cover_url as book_cover_url,
  b.info_link as book_info_link,
  c.title,
  c.body,
  c.action_step,
  c.quote,
  c.quote_author,
  c.difficulty,
  c.language,
  c.status,
  c.quality_score,
  c.style_score,
  c.stash_count,
  c.source_type,
  c.created_at
from public.cards c
join public.categories cat on cat.id = c.category_id
left join public.categories parent on parent.id = cat.parent_id
left join public.books b on b.id = c.book_id;

grant select on public.card_details to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Feed candidates: unseen published cards for the current user.
-- p_include = true  -> cards inside p_category_ids (main categories)
-- p_include = false -> discovery cards outside p_category_ids
-- Ranking mixes quality, style, popularity and a random jitter; the final
-- interleaving across categories happens in lib/feed/mix.ts.
-- ---------------------------------------------------------------------------
create or replace function public.feed_candidates(
  p_language text,
  p_category_ids uuid[],
  p_include boolean,
  p_limit integer default 40
)
returns table (
  id uuid,
  main_category_id uuid,
  rank_score double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    d.id,
    d.main_category_id,
    (coalesce(d.quality_score, 7)::double precision * 0.5
      + coalesce(d.style_score, 7)::double precision * 0.3
      + ln(1 + d.stash_count) * 0.5
      + random() * 2.5) as rank_score
  from public.card_details d
  where d.status = 'published'
    and d.language = p_language
    and (
      coalesce(array_length(p_category_ids, 1), 0) = 0
      or (p_include and d.main_category_id = any (p_category_ids))
      or (not p_include and not (d.main_category_id = any (p_category_ids)))
    )
    and not exists (
      select 1 from public.card_views v
      where v.user_id = (select auth.uid()) and v.card_id = d.id
    )
    and not exists (
      select 1 from public.stashes s
      where s.user_id = (select auth.uid()) and s.card_id = d.id
    )
  order by rank_score desc
  limit least(greatest(p_limit, 1), 200);
$$;

-- ---------------------------------------------------------------------------
-- Daily challenge: one deterministic card per user and per day.
-- ---------------------------------------------------------------------------
create or replace function public.daily_challenge(p_day date)
returns setof public.card_details
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select p.language, p.interests from public.profiles p where p.id = (select auth.uid())
  )
  select d.*
  from public.card_details d, me
  where d.status = 'published'
    and d.language = me.language
    and (
      coalesce(array_length(me.interests, 1), 0) = 0
      or d.main_category_id = any (me.interests)
    )
  order by md5((select auth.uid())::text || p_day::text || d.id::text)
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Streak: called once per meaningful action with the client's local date.
-- ---------------------------------------------------------------------------
create or replace function public.record_activity(p_day date)
returns table (streak_count integer, longest_streak integer, last_active_date date)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  prev date;
  cur integer;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  -- Accept the client's local date only within one day of the server date.
  if p_day < (now() at time zone 'utc')::date - 1 or p_day > (now() at time zone 'utc')::date + 1 then
    raise exception 'invalid day';
  end if;

  select p.last_active_date, p.streak_count into prev, cur
  from public.profiles p where p.id = uid for update;

  if prev is null or prev < p_day - 1 then
    cur := 1;
  elsif prev = p_day - 1 then
    cur := cur + 1;
  end if;
  -- prev = p_day (or a later day from another timezone) keeps the streak as is.

  update public.profiles p
  set streak_count = cur,
      longest_streak = greatest(p.longest_streak, cur),
      last_active_date = greatest(coalesce(p.last_active_date, p_day), p_day)
  where p.id = uid;

  return query
    select p.streak_count, p.longest_streak, p.last_active_date
    from public.profiles p where p.id = uid;
end;
$$;

revoke execute on function public.record_activity(date) from public, anon;
grant execute on function public.record_activity(date) to authenticated;

-- ---------------------------------------------------------------------------
-- Progress per main category for the current user.
-- ---------------------------------------------------------------------------
create or replace function public.category_progress()
returns table (
  category_id uuid,
  slug text,
  name_fr text,
  name_en text,
  icon text,
  total bigint,
  seen bigint,
  stashed bigint,
  completed bigint,
  reviewed bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (
    select coalesce(
      (select p.language from public.profiles p where p.id = (select auth.uid())),
      'fr'
    ) as language
  ),
  pub as (
    select d.id, d.main_category_id
    from public.card_details d, me
    where d.status = 'published' and d.language = me.language
  )
  select
    m.id,
    m.slug,
    m.name_fr,
    m.name_en,
    m.icon,
    (select count(*) from pub where pub.main_category_id = m.id),
    (select count(distinct v.card_id) from public.card_views v join pub on pub.id = v.card_id
       where pub.main_category_id = m.id and v.user_id = (select auth.uid())),
    (select count(*) from public.stashes s join pub on pub.id = s.card_id
       where pub.main_category_id = m.id and s.user_id = (select auth.uid())),
    (select count(distinct v.card_id) from public.card_views v join pub on pub.id = v.card_id
       where pub.main_category_id = m.id and v.user_id = (select auth.uid()) and v.action = 'completed'),
    (select count(*) from public.card_reviews r join pub on pub.id = r.card_id
       where pub.main_category_id = m.id and r.user_id = (select auth.uid()) and r.repetitions > 0)
  from public.categories m
  where m.parent_id is null
  order by m.sort_order;
$$;

-- ---------------------------------------------------------------------------
-- Semantic deduplication (service role only).
-- ---------------------------------------------------------------------------
create or replace function public.match_cards(
  query_embedding extensions.vector(384),
  match_language text,
  match_threshold double precision default 0.92,
  match_count integer default 5
)
returns table (id uuid, title text, similarity double precision)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id, c.title, 1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.cards c
  where c.embedding is not null
    and c.language = match_language
    and c.status in ('published', 'draft')
    and 1 - (c.embedding operator(extensions.<=>) query_embedding) > match_threshold
  order by c.embedding operator(extensions.<=>) query_embedding
  limit match_count;
$$;

revoke execute on function public.match_cards(extensions.vector, text, double precision, integer) from public, anon, authenticated;
grant execute on function public.match_cards(extensions.vector, text, double precision, integer) to service_role;

-- Card counts per main category and language (admin dashboard and seed script).
create or replace function public.category_card_counts()
returns table (category_id uuid, slug text, language text, status text, total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.id, m.slug, c.language, c.status, count(*)
  from public.cards c
  join public.categories cat on cat.id = c.category_id
  join public.categories m on m.id = coalesce(cat.parent_id, cat.id)
  group by m.id, m.slug, c.language, c.status;
$$;

revoke execute on function public.category_card_counts() from public, anon, authenticated;
grant execute on function public.category_card_counts() to service_role;
