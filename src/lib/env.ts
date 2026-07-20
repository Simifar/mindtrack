import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().min(16, "JWT_SECRET должен быть не короче 16 символов"),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_KEY должен быть 32 байта в hex (64 символа)"),
  DATABASE_URL: z.string(),
});

function loadEnv() {
  const parsed = envSchema.safeParse({
    JWT_SECRET: process.env.JWT_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  });
  if (!parsed.success) {
    // В dev падаем с понятной ошибкой.
    console.error("❌ Некорректные переменные окружения:", parsed.error.flatten().fieldErrors);
    throw new Error("Некорректные переменные окружения");
  }
  return parsed.data;
}

export const env = loadEnv();
