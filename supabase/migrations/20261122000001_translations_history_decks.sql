-- Stash: bilingual cards, reading history, daily deck.
--
-- 1. cards keeps the identity of an idea (category, book, difficulty, scores);
--    its text lives in card_translations (one row per language).
-- 2. user_card_state records what each user has read (kept up to date by triggers).
-- 3. daily_deck / daily_deck_state hold the ordered deck of the day and the position.
-- 4. profiles gains daily_limit and timezone.

-- ---------------------------------------------------------------------------
-- card_translations
-- ---------------------------------------------------------------------------
create table public.card_translations (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  language text not null check (language in ('fr', 'en')),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 40 and 900),
  action_step text not null check (char_length(action_step) between 10 and 300),
  quote text check (
    quote is null
    or array_length(regexp_split_to_array(btrim(quote), '\s+'), 1) < 15
  ),
  quote_author text,
  style_score numeric(4, 2) check (style_score is null or style_score between 0 and 10),
  status text not null default 'draft' check (status in ('draft', 'published', 'rejected')),
  content_hash text not null unique,
  embedding extensions.vector(384),
  rejection_reason text,
  search tsvector generated always as (
    to_tsvector(
      case when language = 'fr' then 'french'::regconfig else 'english'::regconfig end,
      coalesce(title, '') || ' ' || coalesce(body, '') || ' ' || coalesce(action_step, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  unique (card_id, language)
);
create index card_translations_card_idx on public.card_translations (card_id);
create index card_translations_lang_status_idx on public.card_translations (language, status);
create index card_translations_search_idx on public.card_translations using gin (search);
create index card_translations_embedding_idx on public.card_translations using hnsw (embedding extensions.vector_cosine_ops);

-- Existing cards keep their original language as their first translation.
insert into public.card_translations
  (card_id, language, title, body, action_step, quote, quote_author, style_score, status, content_hash, embedding, rejection_reason, created_at)
select id, language, title, body, action_step, quote, quote_author, style_score, status, content_hash, embedding, rejection_reason, created_at
from public.cards;

-- ---------------------------------------------------------------------------
-- Remove the text columns from cards (objects depending on them go first)
-- ---------------------------------------------------------------------------
drop function if exists public.daily_challenge(date);
drop view if exists public.card_details;

alter table public.cards
  drop column search,
  drop column embedding,
  drop column title,
  drop column body,
  drop column action_step,
  drop column quote,
  drop column quote_author,
  drop column language,
  drop column style_score,
  drop column content_hash;

-- ---------------------------------------------------------------------------
-- RLS for translations: published only, and only when the card itself is published.
-- ---------------------------------------------------------------------------
alter table public.card_translations enable row level security;
create policy "published translations are public" on public.card_translations
  for select to anon, authenticated
  using (
    status = 'published'
    and exists (select 1 from public.cards c where c.id = card_id and c.status = 'published')
  );
revoke insert, update, delete on public.card_translations from anon, authenticated;

-- ---------------------------------------------------------------------------
-- card_details: one row per (card, language). `id` is the card id.
-- ---------------------------------------------------------------------------
create view public.card_details
with (security_invoker = true)
as
select
  c.id,
  t.id as translation_id,
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
  t.title,
  t.body,
  t.action_step,
  t.quote,
  t.quote_author,
  c.difficulty,
  t.language,
  t.status,
  c.quality_score,
  t.style_score,
  c.stash_count,
  c.source_type,
  c.created_at
from public.cards c
join public.card_translations t on t.card_id = c.id
join public.categories cat on cat.id = c.category_id
left join public.categories parent on parent.id = cat.parent_id
left join public.books b on b.id = c.book_id;

grant select on public.card_details to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Functions that read the text
-- ---------------------------------------------------------------------------
create function public.daily_challenge(p_day date)
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
  select t.card_id, t.title, 1 - (t.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.card_translations t
  where t.embedding is not null
    and t.language = match_language
    and t.status in ('published', 'draft')
    and 1 - (t.embedding operator(extensions.<=>) query_embedding) > match_threshold
  order by t.embedding operator(extensions.<=>) query_embedding
  limit match_count;
$$;

create or replace function public.category_card_counts()
returns table (category_id uuid, slug text, language text, status text, total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.id, m.slug, t.language, t.status, count(*)
  from public.card_translations t
  join public.cards c on c.id = t.card_id
  join public.categories cat on cat.id = c.category_id
  join public.categories m on m.id = coalesce(cat.parent_id, cat.id)
  group by m.id, m.slug, t.language, t.status;
$$;

-- ---------------------------------------------------------------------------
-- user_card_state: reading history, maintained by triggers
-- ---------------------------------------------------------------------------
create table public.user_card_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  first_read_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  read_count integer not null default 1 check (read_count >= 0),
  is_stashed boolean not null default false,
  primary key (user_id, card_id)
);
create index user_card_state_recent_idx on public.user_card_state (user_id, last_read_at desc);
create index user_card_state_card_idx on public.user_card_state (card_id);

alter table public.user_card_state enable row level security;
create policy "read own card state" on public.user_card_state
  for select to authenticated using ((select auth.uid()) = user_id);
-- No write policy: only the triggers below (security definer) change this table.
revoke insert, update, delete on public.user_card_state from anon, authenticated;

create or replace function public.track_card_read()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.action = 'seen' then
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

create trigger card_views_track_read
  after insert on public.card_views
  for each row execute function public.track_card_read();

create or replace function public.track_card_stash()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- Saved without having been read yet (e.g. from a shared link): zero reads.
    insert into public.user_card_state (user_id, card_id, read_count, is_stashed)
    values (new.user_id, new.card_id, 0, true)
    on conflict (user_id, card_id) do update set is_stashed = true;
    return new;
  end if;
  update public.user_card_state set is_stashed = false
  where user_id = old.user_id and card_id = old.card_id;
  return old;
end;
$$;

create trigger stashes_track_state
  after insert or delete on public.stashes
  for each row execute function public.track_card_stash();

-- Backfill from existing history.
insert into public.user_card_state (user_id, card_id, first_read_at, last_read_at, read_count)
select user_id, card_id, min(created_at), max(created_at), count(*)
from public.card_views
where action = 'seen'
group by user_id, card_id
on conflict do nothing;

insert into public.user_card_state (user_id, card_id, read_count, is_stashed)
select user_id, card_id, 0, true from public.stashes
on conflict (user_id, card_id) do update set is_stashed = true;

-- ---------------------------------------------------------------------------
-- Daily deck: ordered new cards for one user and one local day
-- ---------------------------------------------------------------------------
create table public.daily_deck (
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_date date not null,
  card_id uuid not null references public.cards (id) on delete cascade,
  position integer not null check (position >= 1),
  seen_at timestamptz,
  primary key (user_id, deck_date, position),
  unique (user_id, deck_date, card_id)
);
create index daily_deck_card_idx on public.daily_deck (card_id);

create table public.daily_deck_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_date date not null,
  current_position integer not null default 1 check (current_position >= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, deck_date)
);

alter table public.daily_deck enable row level security;
alter table public.daily_deck_state enable row level security;

create policy "read own deck" on public.daily_deck
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own deck" on public.daily_deck
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own deck" on public.daily_deck
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke delete on public.daily_deck from anon, authenticated;

create policy "read own deck state" on public.daily_deck_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own deck state" on public.daily_deck_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own deck state" on public.daily_deck_state
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke delete on public.daily_deck_state from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profile settings
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column daily_limit text not null default 'unlimited' check (daily_limit in ('50', 'unlimited')),
  add column timezone text not null default 'UTC';

grant update (daily_limit, timezone) on public.profiles to authenticated;
