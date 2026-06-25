import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.string().min(1).optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).optional(),
  EMAIL_PROVIDER: z.string().min(1).optional(),
  EMAIL_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  BUG_API_KEY: z.string().min(1).optional(),
});

export const serverEnv = serverEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || undefined,
  AI_PROVIDER: process.env.AI_PROVIDER || undefined,
  AI_BASE_URL: process.env.AI_BASE_URL || undefined,
  AI_API_KEY: process.env.AI_API_KEY || undefined,
  AI_MODEL: process.env.AI_MODEL || undefined,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || undefined,
  EMAIL_API_KEY: process.env.EMAIL_API_KEY || undefined,
  EMAIL_FROM: process.env.EMAIL_FROM || undefined,
  BUG_API_KEY: process.env.BUG_API_KEY || undefined,
});
