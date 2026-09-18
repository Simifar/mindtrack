import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, verifyPassword, hashPassword, revokeAllUserSessions } from "@/lib/auth";
import { changePasswordSchema, apiError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { withApiHandler } from "@/lib/route-handler";

/**
 * POST /api/auth/change-password — смена пароля залогиненным пользователем.
 * Требует текущий пароль; отзывает все прочие сессии пользователя.
 */
export const POST = withApiHandler("auth.changePassword", async (req, { logger, ip }) => {
  const user = await requireUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }
  const { currentPassword, newPassword } = parsed.data;

  if (!rateLimit(`change-password:${ip}:${user.id}`, 5, 10 * 60 * 1000).allowed) {
    logger.warn("auth.changePassword.rateLimited", { userId: user.id });
    return apiError("Слишком много попыток, попробуйте позже", 429);
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(currentPassword, dbUser.passwordHash))) {
    logger.warn("auth.changePassword.wrongCurrent", { userId: user.id });
    return apiError("Неверный текущий пароль", 401);
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await revokeAllUserSessions(user.id, user.sessionId);

  logger.info("auth.changePassword.success", { userId: user.id });
  return NextResponse.json({ ok: true });
});
