import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildReportData } from "@/lib/pdf-report";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildReportDocument } from "@/lib/pdf-report";
import { withApiHandler } from "@/lib/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/export/share/[token]
 *  — публичная read-only ссылка (без аутентификации).
 *  — возвращает JSON с данными отчёта (?format=json) или PDF (?format=pdf, по умолчанию).
 *  — TTL: после expiresAt доступ закрывается (403).
 */
export const GET = withApiHandler("share.get", async (req, { logger, params }) => {
  const { token } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "pdf";

  const log = await db.exportLog.findUnique({
    where: { shareToken: token },
    include: {
      user: { select: { email: true } },
    },
  });
  if (!log) {
    logger.warn("share.get.notFound", { token });
    return NextResponse.json({ error: "Ссылка не найдена" }, { status: 404 });
  }
  if (!log.expiresAt || log.expiresAt.getTime() < Date.now()) {
    logger.warn("share.get.expired", { token });
    return NextResponse.json({ error: "Срок действия ссылки истёк" }, { status: 403 });
  }

  const sections = log.includedSections as string[];

  const [tests, diary] = await Promise.all([
    db.testResponse.findMany({
      where: { userId: log.userId, completedAt: { gte: log.dateRangeFrom, lte: log.dateRangeTo } },
      orderBy: { completedAt: "asc" },
      include: { testDefinition: { select: { code: true, name: true } } },
    }),
    db.diaryEntry.findMany({
      where: { userId: log.userId, date: { gte: log.dateRangeFrom, lte: log.dateRangeTo } },
      orderBy: { date: "asc" },
    }),
  ]);

  const reportData = buildReportData({
    userEmail: log.user.email,
    dateFrom: log.dateRangeFrom,
    dateTo: log.dateRangeTo,
    sections,
    tests,
    diary,
  });

  if (format === "json") {
    logger.info("share.get.json", { token, format });
    return NextResponse.json({ report: reportData });
  }

  const doc = buildReportDocument(reportData);
  const pdfBuffer = await renderToBuffer(doc);
  logger.info("share.get.pdf", { token, format });
  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="mindtrack-shared-report.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
});
