import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { decryptSafe } from "@/lib/crypto";
import { withApiHandler } from "@/lib/route-handler";
import { z } from "zod";
import { apiError } from "@/lib/validation";

const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата. Ожидается YYYY-MM-DD");

/** GET /api/diary/[date] — запись за конкретный день (YYYY-MM-DD). */
export const GET = withApiHandler("diary.getByDate", async (_req, { params }) => {
  const user = await requireUser();
  const { date } = await params;
  if (!dateParamSchema.safeParse(date).success) {
    return apiError("Некорректная дата. Ожидается YYYY-MM-DD", 400);
  }
  const dateObj = new Date(date + "T12:00:00.000Z");
  if (isNaN(dateObj.getTime())) {
    return apiError("Некорректная дата", 400);
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
