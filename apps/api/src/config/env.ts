import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default('localhost'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  TOTP_ISSUER: z.string().default('VKY.SaaS'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_API_KEY: z.string().optional(),
  TWILIO_API_SECRET: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function loadEnv(): Env {
  if (!env) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
      process.exit(1);
    }
    env = parsed.data;
  }
  return env;
}

export function getEnv(): Env {
  if (!env) {
    throw new Error('Entorno no cargado. Llamá a loadEnv() primero.');
  }
  return env;
}
