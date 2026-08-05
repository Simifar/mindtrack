import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildReportData } from "@/lib/pdf-report";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildReportDocument } from "@/lib/pdf-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/export/share/[token]
 *  — публичная read-only ссылка (без аутентификации).
 *  — возвращает JSON с данными отчёта (?format=json) или PDF (?format=pdf, по умолчанию).
 *  — TTL: после expiresAt доступ закрывается (403).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "pdf";

  const log = await db.exportLog.findUnique({
    where: { shareToken: token },
    include: {
      user: { select: { email: true } },
    },
  });
  if (!log) return NextResponse.json({ error: "Ссылка не найдена" }, { status: 404 });
  if (!log.expiresAt || log.expiresAt.getTime() < Date.now()) {
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
    return NextResponse.json({ report: reportData });
  }

  const doc = buildReportDocument(reportData);
  const pdfBuffer = await renderToBuffer(doc);
  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="mindtrack-shared-report.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
