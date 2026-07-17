import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .transform((v) => v.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const displayNameSchema = z
  .string()
  .min(2, "Display name must be at least 2 characters")
  .max(50, "Display name must be at most 50 characters")
  .trim();

export const registerSchema = z.object({
  email: emailSchema,
  name: displayNameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

export const profileUpdateSchema = z.object({
  name: displayNameSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
