import { z } from "zod";

export const createMenuSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive"),
    category: z.string().min(2, "Category is required"),
    image: z.string().url().optional(),
    isAvailable: z.boolean().default(true),
  }),
});

export const updateMenuSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    category: z.string().min(2).optional(),
    image: z.string().url().optional(),
    isAvailable: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getMenusByProviderSchema = z.object({
  params: z.object({
    providerId: z.string().uuid(),
  }),
  query: z.object({
    category: z.string().optional(),
    isAvailable: z.string().optional(),
  }),
});