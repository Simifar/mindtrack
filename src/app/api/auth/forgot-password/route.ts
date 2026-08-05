import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forgotPasswordSchema, apiError } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 час

/**
 * POST /api/auth/forgot-password — запрос ссылки сброса пароля.
 * Ответ всегда одинаковый (анти-enumерация email).
 * Почтовой инфраструктуры нет: в dev-режиме ссылка пишется в лог и возвращается в ответе.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }
  const email = parsed.data.email.toLowerCase();
  const ip = clientIp(req);

  if (!rateLimit(`forgot:${ip}:${email}`, 3, 10 * 60 * 1000).allowed) {
    return apiError("Слишком много попыток, попробуйте позже", 429);
  }

  const okResponse = { ok: true as const, message: "Если аккаунт существует, ссылка для сброса отправлена" };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(okResponse);
  }

  // Инвалидируем предыдущие токены пользователя.
  await db.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  const origin = new URL(req.url).origin;
  const resetUrl = `${origin}/?resetToken=${token}`;
  console.log(`[auth] Ссылка сброса пароля для ${email}: ${resetUrl}`);

  // В production resetUrl не возвращаем (там появится отправка почты).
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ...okResponse, resetUrl });
  }
  return NextResponse.json(okResponse);
}
