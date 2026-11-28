-- Stash: cards are told as a short story.
--
-- A card now reads: title -> story (a small scene that puts you in the idea)
-- -> what to remember (the existing `body`) -> action. The story is optional at
-- the database level so that older cards keep working; the generation pipeline
-- requires it for every new card.

alter table public.card_translations
  add column story text check (story is null or char_length(story) between 40 and 1200);

comment on column public.card_translations.story is 'A short narrative scene (3 to 6 sentences) that puts the reader inside the idea.';
comment on column public.card_translations.body is 'What to remember: the lesson, in 1 to 4 sentences.';

-- Full-text search now covers the story too.
drop index public.card_translations_search_idx;
alter table public.card_translations drop column search;
alter table public.card_translations
  add column search tsvector generated always as (
    to_tsvector(
      case when language = 'fr' then 'french'::regconfig else 'english'::regconfig end,
      coalesce(title, '') || ' ' || coalesce(story, '') || ' ' || coalesce(body, '') || ' ' || coalesce(action_step, '')
    )
  ) stored;
create index card_translations_search_idx on public.card_translations using gin (search);

-- card_details exposes the story (appended last so dependent functions keep working).
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
  t.story
from public.cards c
join public.card_translations t on t.card_id = c.id
join public.categories cat on cat.id = c.category_id
left join public.categories parent on parent.id = cat.parent_id
left join public.books b on b.id = c.book_id;
