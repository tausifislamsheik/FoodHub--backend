import { z } from "zod";

export const approveProviderSchema = z.object({
  params: z.object({
    providerId: z.string().uuid(),
  }),
  body: z.object({
    isApproved: z.boolean(),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});