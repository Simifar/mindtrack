import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { exportRequestSchema, apiError } from "@/lib/validation";
import { buildReportData, buildReportDocument } from "@/lib/pdf-report";
import { renderToBuffer } from "@react-pdf/renderer";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { withApiHandler } from "@/lib/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDate(s: string): Date {
  const d = new Date(s + "T12:00:00.000Z");
  if (isNaN(d.getTime())) throw new Error("bad date");
  return d;
}

/**
 * POST /api/export
 *  - генерирует PDF и возвращает его как binary (Content-Type: application/pdf)
 *  - при generateShareLink=true — НЕ возвращает PDF, а создаёт ExportLog с shareToken и возвращает JSON {shareUrl, expiresAt}
 *
 * Заголовок для скачивания: клиент вызывает fetch и использует blob.
 */
export const POST = withApiHandler("export.create", async (req, { logger }) => {
  const user = await requireUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = exportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }
  const { dateFrom, dateTo, sections, generateShareLink, shareTtlDays } = parsed.data;

  let from: Date, to: Date;
  try {
    from = parseDate(dateFrom);
    to = parseDate(dateTo);
  } catch {
    return apiError("Некорректный диапазон дат", 400);
  }
  if (from > to) return apiError("Дата «от» позже даты «до»", 400);

  const [tests, diary] = await Promise.all([
    db.testResponse.findMany({
      where: { userId: user.id, completedAt: { gte: from, lte: to } },
      orderBy: { completedAt: "asc" },
      include: { testDefinition: { select: { code: true, name: true } } },
    }),
    db.diaryEntry.findMany({
      where: { userId: user.id, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    }),
  ]);

  const reportData = buildReportData({
    userEmail: user.email,
    dateFrom: from,
    dateTo: to,
    sections,
    tests,
    diary,
  });

  // Лог экспорта + опциональная share-ссылка.
  let shareToken: string | null = null;
  let expiresAt: Date | null = null;
  if (generateShareLink) {
    shareToken = randomBytes(16).toString("hex");
    expiresAt = new Date(Date.now() + shareTtlDays * 24 * 60 * 60 * 1000);
  }
  await db.exportLog.create({
    data: {
      userId: user.id,
      dateRangeFrom: from,
      dateRangeTo: to,
      includedSections: sections as Prisma.InputJsonValue,
      shareToken,
      expiresAt,
    },
  });

  if (generateShareLink) {
    if (!expiresAt) {
      return apiError("Не удалось создать ссылку", 500);
    }
    logger.info("export.shareLink.created", { userId: user.id, shareToken, expiresAt: expiresAt.toISOString() });
    return NextResponse.json({
      shareUrl: `/?share=${shareToken}`,
      shareToken,
      expiresAt: expiresAt.toISOString(),
    });
  }

  // Генерация PDF.
  const doc = buildReportDocument(reportData);
  const pdfBuffer = await renderToBuffer(doc);

  logger.info("export.pdf.generated", { userId: user.id, dateFrom, dateTo });
  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mindtrack-report-${dateFrom}-to-${dateTo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});
