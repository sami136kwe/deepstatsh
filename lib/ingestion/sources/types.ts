export type BookCandidate = {
  source: "google" | "openlibrary";
  googleBooksId: string | null;
  openLibraryId: string | null;
  title: string;
  author: string;
  language: string | null;
  publishedYear: number | null;
  coverUrl: string | null;
  description: string | null;
  averageRating: number | null;
  ratingsCount: number;
  infoLink: string | null;
};
