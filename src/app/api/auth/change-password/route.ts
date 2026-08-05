import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError, verifyPassword, hashPassword, revokeAllUserSessions } from "@/lib/auth";
import { changePasswordSchema, apiError } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/change-password — смена пароля залогиненным пользователем.
 * Требует текущий пароль; отзывает все прочие сессии пользователя.
 */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return apiError("Не авторизован", 401);
    throw e;
  }

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

  const ip = clientIp(req);
  if (!rateLimit(`change-password:${ip}:${user.id}`, 5, 10 * 60 * 1000).allowed) {
    return apiError("Слишком много попыток, попробуйте позже", 429);
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(currentPassword, dbUser.passwordHash))) {
    return apiError("Неверный текущий пароль", 401);
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await revokeAllUserSessions(user.id, user.sessionId);

  return NextResponse.json({ ok: true });
}
