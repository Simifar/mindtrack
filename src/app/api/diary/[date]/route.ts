import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { decryptSafe } from "@/lib/crypto";
import { withApiHandler } from "@/lib/route-handler";

/** GET /api/diary/[date] — запись за конкретный день (YYYY-MM-DD). */
export const GET = withApiHandler("diary.getByDate", async (_req, { params }) => {
  const user = await requireUser();
  const { date } = await params;
  const dateObj = new Date(date + "T12:00:00.000Z");
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "Некорректная дата" }, { status: 400 });
  }
  const entry = await db.diaryEntry.findUnique({
    where: { userId_date: { userId: user.id, date: dateObj } },
  });
  if (!entry) return NextResponse.json({ entry: null });
  return NextResponse.json({
    entry: {
      id: entry.id,
      date: entry.date.toISOString(),
      mood: entry.mood,
      sleepHours: entry.sleepHours,
      energyLevel: entry.energyLevel,
      notes: entry.notesCipher ? decryptSafe(entry.notesCipher) : "",
      crisisDetected: entry.crisisDetected,
    },
  });
});
