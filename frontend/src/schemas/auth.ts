import { z } from "zod";

export const registerSchema = z.object({
  full_name: z.string().min(1, "Name required"),
  email: z.email("Invalid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
