-- Stash: re-reading cards that were already read.
--
-- * card_views gets a "reread" action, kept apart from "seen" so that re-reading
--   never counts towards the daily goal or the streak.
-- * profiles stores the feed's re-read setting (switch + share of re-read cards).
-- * history_cards() lists what a user has read, reread_candidates() picks what to re-read.

alter table public.card_views drop constraint card_views_action_check;
alter table public.card_views
  add constraint card_views_action_check check (action in ('seen', 'skipped', 'stashed', 'completed', 'reread'));

-- A re-read counts as a read (read_count, last_read_at) but never changes first_read_at.
create or replace function public.track_card_read()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.action in ('seen', 'reread') then
    insert into public.user_card_state (user_id, card_id, first_read_at, last_read_at, read_count)
    values (new.user_id, new.card_id, new.created_at, new.created_at, 1)
    on conflict (user_id, card_id) do update
      set first_read_at = case
            when public.user_card_state.read_count = 0 then excluded.first_read_at
            else public.user_card_state.first_read_at
          end,
          last_read_at = excluded.last_read_at,
          read_count = public.user_card_state.read_count + 1;
  end if;
  return new;
end;
$$;

alter table public.profiles
  add column include_reread boolean not null default false,
  add column reread_ratio smallint not null default 20 check (reread_ratio in (10, 20, 30, 50));

grant update (include_reread, reread_ratio) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- History: every card the user has read, newest first, with filters.
-- ---------------------------------------------------------------------------
create or replace function public.history_cards(
  p_language text,
  p_category uuid default null,      -- main category
  p_sub uuid default null,           -- subcategory
  p_stashed boolean default false,   -- only saved cards
  p_from timestamptz default null,   -- last read on or after
  p_to timestamptz default null,     -- last read before
  p_q text default null,             -- full-text search in the active language
  p_limit integer default 30,
  p_offset integer default 0
)
returns table (
  card_id uuid,
  first_read_at timestamptz,
  last_read_at timestamptz,
  read_count integer,
  is_stashed boolean,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.card_id,
    s.first_read_at,
    s.last_read_at,
    s.read_count,
    s.is_stashed,
    count(*) over () as total_count
  from public.user_card_state s
  join public.card_details d on d.id = s.card_id and d.language = p_language and d.status = 'published'
  where s.user_id = (select auth.uid())
    and s.read_count > 0
    and (p_category is null or d.main_category_id = p_category)
    and (p_sub is null or d.category_id = p_sub)
    and (not p_stashed or s.is_stashed)
    and (p_from is null or s.last_read_at >= p_from)
    and (p_to is null or s.last_read_at < p_to)
    and (
      p_q is null
      or exists (
        select 1
        from public.card_translations t
        where t.card_id = s.card_id
          and t.language = p_language
          and t.search @@ websearch_to_tsquery(
            case when p_language = 'fr' then 'french'::regconfig else 'english'::regconfig end,
            p_q
          )
      )
    )
  order by s.last_read_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Cards to re-read. Modes: random, oldest (read longest ago first),
-- least (fewest reads first), stashed (saved cards only). An optional main
-- category narrows any mode.
-- ---------------------------------------------------------------------------
create or replace function public.reread_candidates(
  p_language text,
  p_mode text default 'random',
  p_category uuid default null,
  p_limit integer default 20,
  p_exclude uuid[] default '{}'
)
returns table (card_id uuid, read_count integer, last_read_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.card_id, s.read_count, s.last_read_at
  from public.user_card_state s
  join public.card_details d on d.id = s.card_id and d.language = p_language and d.status = 'published'
  where s.user_id = (select auth.uid())
    and s.read_count > 0
    and not (s.card_id = any (p_exclude))
    and (p_mode <> 'stashed' or s.is_stashed)
    and (p_category is null or d.main_category_id = p_category)
  order by
    case when p_mode = 'random' or p_mode = 'category' or p_mode = 'stashed' then random() end,
    case when p_mode = 'least' then s.read_count end asc,
    s.last_read_at asc
  limit least(greatest(p_limit, 1), 100);
$$;
