import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_RECEPTION_MODEL: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  AI_RECEPTION_ENABLED: z.string().optional(),
  AI_RECEPTION_ADMIN_EMAIL: z.string().optional()
});

export const env = envSchema.parse(process.env);
