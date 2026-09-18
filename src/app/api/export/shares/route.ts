import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { withApiHandler } from "@/lib/route-handler";

/**
 * GET /api/export/shares — список активных share-ссылок пользователя.
 * Возвращает только неистёкшие ссылки (истёкшие считаются отозванными по TTL).
 */
export const GET = withApiHandler("export.shares", async () => {
  const user = await requireUser();

  const logs = await db.exportLog.findMany({
    where: {
      userId: user.id,
      shareToken: { not: null },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    items: logs.map((l) => ({
      shareToken: l.shareToken as string,
      shareUrl: `/?share=${l.shareToken}`,
      expiresAt: l.expiresAt?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
      dateRangeFrom: l.dateRangeFrom.toISOString().slice(0, 10),
      dateRangeTo: l.dateRangeTo.toISOString().slice(0, 10),
      includedSections: l.includedSections as string[],
    })),
  });
});