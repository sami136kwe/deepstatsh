-- Stash: core schema
-- Tables, indexes, triggers. Row Level Security lives in the next migration.

create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- categories (two levels: main category > subcategory)
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_fr text not null,
  name_en text not null,
  parent_id uuid references public.categories (id) on delete cascade,
  description text,
  description_en text,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index categories_parent_id_idx on public.categories (parent_id);

-- ---------------------------------------------------------------------------
-- books
-- ---------------------------------------------------------------------------
create table public.books (
  id uuid primary key default gen_random_uuid(),
  google_books_id text unique,
  open_library_id text unique,
  dedup_key text not null unique,
  title text not null,
  author text not null,
  language text,
  published_year integer,
  cover_url text,
  description text,
  average_rating numeric(3, 2),
  ratings_count integer not null default 0,
  info_link text,
  is_public_domain boolean not null default false,
  popularity_score numeric(6, 2) not null default 0,
  source_category_id uuid references public.categories (id) on delete set null,
  processed_at timestamptz,
  process_attempts integer not null default 0,
  created_at timestamptz not null default now()
);
create index books_popularity_score_idx on public.books (popularity_score desc);
create index books_source_category_idx on public.books (source_category_id);
create index books_unprocessed_idx on public.books (source_category_id, popularity_score desc) where processed_at is null;

-- ---------------------------------------------------------------------------
-- ingestion runs and queries
-- ---------------------------------------------------------------------------
create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source text not null check (source in ('cron', 'seed', 'admin', 'manual')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  books_found integer not null default 0,
  cards_created integer not null default 0,
  cards_rejected integer not null default 0,
  model_calls integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  details jsonb not null default '{}'::jsonb
);
create index ingestion_runs_started_at_idx on public.ingestion_runs (started_at desc);

create table public.ingestion_queries (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  query_text text not null,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  unique (category_id, query_text)
);
create index ingestion_queries_last_run_idx on public.ingestion_queries (last_run_at nulls first);

-- ---------------------------------------------------------------------------
-- cards
-- ---------------------------------------------------------------------------
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  book_id uuid references public.books (id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 40 and 900),
  action_step text not null check (char_length(action_step) between 10 and 300),
  quote text check (
    quote is null
    or array_length(regexp_split_to_array(btrim(quote), '\s+'), 1) < 15
  ),
  quote_author text,
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  language text not null check (language in ('fr', 'en')),
  status text not null default 'draft' check (status in ('draft', 'published', 'rejected')),
  quality_score numeric(4, 2) check (quality_score is null or quality_score between 0 and 10),
  style_score numeric(4, 2) check (style_score is null or style_score between 0 and 10),
  content_hash text not null unique,
  embedding extensions.vector(384),
  source_type text not null default 'pipeline' check (source_type in ('seed', 'pipeline', 'manual')),
  ingestion_run_id uuid references public.ingestion_runs (id) on delete set null,
  rejection_reason text,
  human_reviewed boolean not null default false,
  stash_count integer not null default 0,
  search tsvector generated always as (
    to_tsvector(
      case when language = 'fr' then 'french'::regconfig else 'english'::regconfig end,
      coalesce(title, '') || ' ' || coalesce(body, '') || ' ' || coalesce(action_step, '')
    )
  ) stored,
  created_at timestamptz not null default now()
);
create index cards_category_id_idx on public.cards (category_id);
create index cards_status_idx on public.cards (status);
create index cards_book_id_idx on public.cards (book_id);
create index cards_run_idx on public.cards (ingestion_run_id);
create index cards_lang_status_idx on public.cards (language, status, category_id);
create index cards_search_idx on public.cards using gin (search);
create index cards_embedding_idx on public.cards using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- user data
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 60),
  interests uuid[] not null default '{}',
  daily_goal smallint not null default 5 check (daily_goal in (3, 5, 10)),
  streak_count integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  language text not null default 'fr' check (language in ('fr', 'en')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stashes (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  primary key (user_id, card_id)
);
create index stashes_card_id_idx on public.stashes (card_id);
create index stashes_user_created_idx on public.stashes (user_id, created_at desc);

create table public.card_reviews (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  rating smallint check (rating is null or rating between 1 and 4),
  next_review_at timestamptz not null default now(),
  interval_days integer not null default 0 check (interval_days >= 0),
  ease_factor numeric(4, 2) not null default 2.5 check (ease_factor >= 1.3),
  repetitions integer not null default 0,
  last_reviewed_at timestamptz,
  primary key (user_id, card_id)
);
create index card_reviews_due_idx on public.card_reviews (user_id, next_review_at);

create table public.card_views (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  action text not null check (action in ('seen', 'skipped', 'stashed', 'completed')),
  created_at timestamptz not null default now()
);
create index card_views_user_card_idx on public.card_views (user_id, card_id);
create index card_views_user_created_idx on public.card_views (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------

-- Create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lang text := coalesce(new.raw_user_meta_data ->> 'language', 'fr');
begin
  if lang not in ('fr', 'en') then
    lang := 'fr';
  end if;
  insert into public.profiles (id, display_name, language)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 60),
    lang
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep cards.stash_count in sync (used to favour popular cards in the feed).
create or replace function public.sync_stash_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.cards set stash_count = stash_count + 1 where id = new.card_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cards set stash_count = greatest(stash_count - 1, 0) where id = old.card_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger stashes_count_trigger
  after insert or delete on public.stashes
  for each row execute function public.sync_stash_count();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
