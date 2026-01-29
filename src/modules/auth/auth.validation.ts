import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password is too long"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional(),
    role: z.enum(["CUSTOMER", "VENDOR"]).default("CUSTOMER"),
    // Vendor-specific fields
    shopName: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
  }).refine((data) => {
    // If role is VENDOR, require shop details
    if (data.role === "VENDOR") {
      return data.shopName && data.address;
    }
    return true;
  }, {
    message: "Shop name and address are required for vendors",
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    deliveryAddress: z.string().optional(),
  }),
});