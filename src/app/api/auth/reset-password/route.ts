import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, revokeAllUserSessions } from "@/lib/auth";
import { resetPasswordSchema, apiError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { withApiHandler } from "@/lib/route-handler";

/**
 * POST /api/auth/reset-password — установка нового пароля по одноразовому токену.
 * После успеха все сессии пользователя отзываются — нужен повторный вход.
 */
export const POST = withApiHandler("auth.resetPassword", async (req, { logger, ip }) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }
  const { token, password } = parsed.data;

  if (!rateLimit(`reset:${ip}`, 10, 10 * 60 * 1000).allowed) {
    logger.warn("auth.resetPassword.rateLimited");
    return apiError("Слишком много попыток, попробуйте позже", 429);
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    logger.warn("auth.resetPassword.invalidToken", { hasRecord: !!record });
    return apiError("Ссылка недействительна или истекла", 400);
  }

  const passwordHash = await hashPassword(password);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await revokeAllUserSessions(record.userId);

  logger.info("auth.resetPassword.success", { userId: record.userId });
  return NextResponse.json({ ok: true });
});
