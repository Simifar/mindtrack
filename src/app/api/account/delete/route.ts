import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, destroySession, verifyPassword } from "@/lib/auth";
import { apiError } from "@/lib/validation";
import { withApiHandler } from "@/lib/route-handler";
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
export const POST = withApiHandler("account.delete", async (req, { logger }) => {
  const user = await requireUser();

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
    logger.warn("account.delete.wrongPassword", { userId: user.id });
    return apiError("Неверный пароль", 401);
  }

  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  logger.info("account.delete.success", { userId: user.id });
  return NextResponse.json({ ok: true });
});
