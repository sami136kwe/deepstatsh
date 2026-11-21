import { z } from "zod";

/** Client local date (YYYY-MM-DD), used for streaks and daily goals. */
export const daySchema = z.iso.date();
export const uuidSchema = z.uuid();

export const feedQuerySchema = z.object({
  size: z.coerce.number().int().min(1).max(30).default(10),
  since: z.iso.datetime({ offset: true }).optional(),
});

export const viewBodySchema = z.object({
  cardId: uuidSchema,
  action: z.enum(["seen", "skipped", "completed"]),
  day: daySchema,
});

export const stashBodySchema = z.object({ cardId: uuidSchema, day: daySchema });
export const unstashBodySchema = z.object({ cardId: uuidSchema });
export const noteBodySchema = z.object({ cardId: uuidSchema, note: z.string().max(2000).nullable() });

export const reviewBodySchema = z.object({
  cardId: uuidSchema,
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  day: daySchema,
});

export const challengeQuerySchema = z.object({ day: daySchema });
export const challengeBodySchema = z.object({ cardId: uuidSchema, day: daySchema });

export const profileBodySchema = z
  .object({
    display_name: z.string().trim().max(60).nullable(),
    interests: z.array(uuidSchema).max(12),
    daily_goal: z.union([z.literal(3), z.literal(5), z.literal(10)]),
    language: z.enum(["fr", "en"]),
    onboarded: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "empty update");

export const searchQuerySchema = z.object({ q: z.string().trim().min(2).max(100) });

export const adminCardBodySchema = z.object({
  cardId: uuidSchema,
  status: z.enum(["published", "rejected"]),
});

export const adminRerunBodySchema = z.object({ categoryId: uuidSchema });
