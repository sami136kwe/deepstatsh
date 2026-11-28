import { DEMO_BOOKS } from "./demo-books";
import { BUSINESS_BOOKS } from "./books/business";
import { GROWTH_BOOKS_2 } from "./books/growth2";
import { BUSINESS_BOOKS_2 } from "./books/business2";
import { RELATIONSHIP_BOOKS_2 } from "./books/relationships2";
import { GROWTH_BOOKS_3A } from "./books/growth3a";
import { GROWTH_BOOKS_3B } from "./books/growth3b";
import { MONEY_BOOKS_2 } from "./books/money2";
import { INVESTMENT_BOOKS } from "./books/investments";
import { GROWTH_BOOKS_1 } from "./books/growth1";
import { RELATIONSHIP_BOOKS } from "./books/relationships";

/** Every book that `npm run seed:demo` loads. */
export const LIBRARY = [...DEMO_BOOKS, ...INVESTMENT_BOOKS, ...BUSINESS_BOOKS, ...RELATIONSHIP_BOOKS, ...GROWTH_BOOKS_1, ...GROWTH_BOOKS_2, ...MONEY_BOOKS_2, ...BUSINESS_BOOKS_2, ...RELATIONSHIP_BOOKS_2, ...GROWTH_BOOKS_3A, ...GROWTH_BOOKS_3B];
