-- Stash becomes a library of books.
--
-- A book has numbered ideas that are unlocked one after the other. Internally an
-- idea is still a row of `cards` (with its text in `card_translations`): the new
-- `position` column gives its number inside the book. The interface no longer
-- talks about "cards".
--
-- Added: book slug / featured flag, per-language book summary, book topics,
-- idea position, two read views (card_details.position, book_overview) and the
-- reading progress (user_books, user_idea_progress) written only by functions
-- that enforce the unlock order.

-- ---------------------------------------------------------------------------
-- Books
-- ---------------------------------------------------------------------------
alter table public.books
  add column slug text,
  add column is_featured boolean not null default false;
create unique index books_slug_idx on public.books (slug) where slug is not null;

create table public.book_translations (
  book_id uuid not null references public.books (id) on delete cascade,
  language text not null check (language in ('fr', 'en')),
  summary text not null check (char_length(summary) between 40 and 800),
  primary key (book_id, language)
);

-- A book belongs to one or more topics (main categories).
create table public.book_topics (
  book_id uuid not null references public.books (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (book_id, category_id)
);
create index book_topics_category_idx on public.book_topics (category_id);

insert into public.book_topics (book_id, category_id)
select id, source_category_id from public.books where source_category_id is not null
on conflict do nothing;

alter table public.book_translations enable row level security;
alter table public.book_topics enable row level security;
create policy "book summaries are public" on public.book_translations for select to anon, authenticated using (true);
create policy "book topics are public" on public.book_topics for select to anon, authenticated using (true);
revoke insert, update, delete on public.book_translations, public.book_topics from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Idea number inside its book
-- ---------------------------------------------------------------------------
alter table public.cards add column position smallint check (position >= 1);
create unique index cards_book_position_idx on public.cards (book_id, position)
  where book_id is not null and position is not null;

-- card_details gets the position (appended last so dependent functions keep working).
create or replace view public.card_details
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
  c.created_at,
  t.story,
  c.position
from public.cards c
join public.card_translations t on t.card_id = c.id
join public.categories cat on cat.id = c.category_id
left join public.categories parent on parent.id = cat.parent_id
left join public.books b on b.id = c.book_id;

-- ---------------------------------------------------------------------------
-- book_overview: one row per book and language, with the number of published
-- ideas available in that language (0 = not readable in that language yet).
-- ---------------------------------------------------------------------------
create view public.book_overview
with (security_invoker = true)
as
select
  b.id,
  b.slug,
  b.title,
  b.author,
  b.cover_url,
  b.published_year,
  b.is_public_domain,
  b.popularity_score,
  b.average_rating,
  b.is_featured,
  b.info_link,
  b.created_at,
  l.language,
  bt.summary,
  (
    select count(*)::integer
    from public.cards c
    join public.card_translations ct on ct.card_id = c.id and ct.language = l.language and ct.status = 'published'
    where c.book_id = b.id and c.status = 'published' and c.position is not null
  ) as idea_count
from public.books b
cross join (values ('fr'), ('en')) as l (language)
left join public.book_translations bt on bt.book_id = b.id and bt.language = l.language;

grant select on public.book_overview to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reading progress. Written only through the functions below.
-- ---------------------------------------------------------------------------
create table public.user_books (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  is_saved boolean not null default false,
  started_at timestamptz,
  last_opened_at timestamptz,
  completed_at timestamptz,
  primary key (user_id, book_id)
);
create index user_books_recent_idx on public.user_books (user_id, last_opened_at desc nulls last);

create table public.user_idea_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, card_id)
);
create index user_idea_progress_book_idx on public.user_idea_progress (user_id, book_id);

alter table public.user_books enable row level security;
alter table public.user_idea_progress enable row level security;
create policy "read own books" on public.user_books for select to authenticated using ((select auth.uid()) = user_id);
create policy "read own idea progress" on public.user_idea_progress for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.user_books, public.user_idea_progress from anon, authenticated;

-- Opening a book marks it as started.
create or replace function public.touch_book(p_book uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  insert into public.user_books (user_id, book_id, started_at, last_opened_at)
  values (uid, p_book, now(), now())
  on conflict (user_id, book_id) do update
    set last_opened_at = now(),
        started_at = coalesce(public.user_books.started_at, now());
end;
$$;

-- Save a book to the library (or remove it) without starting it.
create or replace function public.set_book_saved(p_book uuid, p_saved boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  insert into public.user_books (user_id, book_id, is_saved)
  values (uid, p_book, p_saved)
  on conflict (user_id, book_id) do update set is_saved = p_saved;
end;
$$;

-- Marks an idea as done. An idea can only be completed when every earlier idea
-- of the same book is done, which is what unlocks the next one.
create or replace function public.complete_idea(p_card uuid)
returns table (r_book uuid, r_done integer, r_total integer, r_completed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  v_book uuid;
  v_pos smallint;
  v_prev_total integer;
  v_prev_done integer;
  v_total integer;
  v_done integer;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  select c.book_id, c.position into v_book, v_pos
  from public.cards c
  where c.id = p_card and c.status = 'published' and c.book_id is not null and c.position is not null;
  if v_book is null then
    raise exception 'not a book idea';
  end if;

  select count(*) into v_prev_total
  from public.cards c
  where c.book_id = v_book and c.status = 'published' and c.position is not null and c.position < v_pos;
  select count(*) into v_prev_done
  from public.user_idea_progress p
  join public.cards c on c.id = p.card_id
  where p.user_id = uid and p.book_id = v_book and c.position < v_pos;
  if v_prev_done < v_prev_total then
    raise exception 'idea is locked';
  end if;

  insert into public.user_idea_progress (user_id, card_id, book_id) values (uid, p_card, v_book)
  on conflict do nothing;

  select count(*) into v_total
  from public.cards c
  where c.book_id = v_book and c.status = 'published' and c.position is not null;
  select count(*) into v_done from public.user_idea_progress p where p.user_id = uid and p.book_id = v_book;

  insert into public.user_books (user_id, book_id, started_at, last_opened_at, completed_at)
  values (uid, v_book, now(), now(), case when v_done >= v_total then now() end)
  on conflict (user_id, book_id) do update
    set last_opened_at = now(),
        started_at = coalesce(public.user_books.started_at, now()),
        completed_at = coalesce(public.user_books.completed_at, case when v_done >= v_total then now() end);

  return query select v_book, v_done, v_total, v_done >= v_total;
end;
$$;

revoke execute on function public.touch_book(uuid), public.set_book_saved(uuid, boolean), public.complete_idea(uuid) from public, anon;
grant execute on function public.touch_book(uuid), public.set_book_saved(uuid, boolean), public.complete_idea(uuid) to authenticated;
