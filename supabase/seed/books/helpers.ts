import type { BookSeed } from "../demo-books";

/** [title, story, what to remember, action] */
export type IdeaTuple = [string, string, string, string];

type BookInput = {
  slug: string;
  title: string;
  author: string;
  year: number;
  topics: string[];
  featured?: boolean;
  summary: string;
  ideas: IdeaTuple[];
};

/** Compact way to write a book: the ideas are inspired by it, never quoted from it. */
export function book(input: BookInput): BookSeed {
  return {
    slug: input.slug,
    title: input.title,
    author: input.author,
    published_year: input.year,
    info_link: `https://openlibrary.org/search?q=${encodeURIComponent(`${input.title} ${input.author}`)}`,
    is_public_domain: false,
    is_featured: input.featured ?? false,
    topics: input.topics,
    summary: { en: input.summary },
    ideas: input.ideas.map(([title, story, body, action_step], i) => ({
      position: i + 1,
      difficulty: (i < 2 ? 1 : i < 4 ? 2 : 3) as 1 | 2 | 3,
      en: { title, story, body, action_step },
    })),
  };
}
