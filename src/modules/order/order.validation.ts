import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    providerId: z.string().uuid("Invalid provider ID"),
    items: z.array(
      z.object({
        menuId: z.string().uuid("Invalid menu ID"),
        quantity: z.number().int().positive("Quantity must be positive"),
      })
    ).min(1, "Order must have at least one item"),
    deliveryAddress: z.string().min(5, "Delivery address is required"),
    specialNotes: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "DELIVERED",
      "CANCELLED",
    ]),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});