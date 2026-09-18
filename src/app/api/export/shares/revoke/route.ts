import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/validation";
import { z } from "zod";
import { withApiHandler } from "@/lib/route-handler";

const revokeSchema = z.object({
  shareToken: z.string().min(1, "Отсутствует токен ссылки"),
});

/**
 * POST /api/export/shares/revoke — отзыв share-ссылки.
 * Обнуляет shareToken/expiresAt в ExportLog: публичный доступ закрывается сразу.
 */
export const POST = withApiHandler("export.shares.revoke", async (req, { logger }) => {
  const user = await requireUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }

  const log = await db.exportLog.findFirst({
    where: { userId: user.id, shareToken: parsed.data.shareToken },
  });
  if (!log) {
    return apiError("Ссылка не найдена", 404);
  }

  await db.exportLog.update({
    where: { id: log.id },
    data: { shareToken: null, expiresAt: null },
  });

  logger.info("export.shareLink.revoked", { userId: user.id, exportLogId: log.id });
  return NextResponse.json({ ok: true });
});