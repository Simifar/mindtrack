import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError, destroySession, verifyPassword } from "@/lib/auth";
import { apiError } from "@/lib/validation";
import { z } from "zod";

const deleteSchema = z.object({
  confirm: z.literal("DELETE"),
  password: z.string().min(1, "Введите пароль"),
});

/**
 * POST /api/account/delete — полное удаление аккаунта и всех данных.
 * Требует текущий пароль. Каскадное удаление по userId реализовано
 * в Prisma-схеме (право на забвение).
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
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Требуется подтверждение: {"confirm":"DELETE","password":"..."}', 400);
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(parsed.data.password, dbUser.passwordHash))) {
    return apiError("Неверный пароль", 401);
  }

  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  return NextResponse.json({ ok: true });
}
