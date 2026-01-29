import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    providerId: z.string().uuid("Invalid provider ID"),
    rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
    comment: z.string().optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});