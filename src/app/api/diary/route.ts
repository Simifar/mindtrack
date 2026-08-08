import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { diaryEntrySchema, apiError } from "@/lib/validation";
import { encrypt, decryptSafe } from "@/lib/crypto";
import { detectCrisis } from "@/lib/crisis";
import { withApiHandler } from "@/lib/route-handler";

function startOfDayUTC(iso: string): Date {
  // Принимаем YYYY-MM-DD, создаём дату в UTC полдень (избегаем сдвига часового пояса).
  const d = new Date(iso + "T12:00:00.000Z");
  if (isNaN(d.getTime())) throw new Error("Некорректная дата");
  return d;
}

/** GET /api/diary?from=&to= — записи дневника в диапазоне (по умолчанию 30 дней). */
export const GET = withApiHandler("diary.list", async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  const from = url.searchParams.get("from");

  const now = new Date();
  const toDate = to ? startOfDayUTC(to) : now;
  const fromDate = from
    ? startOfDayUTC(from)
    : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const entries = await db.diaryEntry.findMany({
    where: { userId: user.id, date: { gte: fromDate, lte: toDate } },
    orderBy: { date: "desc" },
  });

  const items = entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    mood: e.mood,
    sleepHours: e.sleepHours,
    energyLevel: e.energyLevel,
    notes: e.notesCipher ? decryptSafe(e.notesCipher) : "",
    customFields: e.customFieldsJson ? (e.customFieldsJson as Record<string, unknown>) : {},
    crisisDetected: e.crisisDetected,
  }));

  return NextResponse.json({ items });
});

/** POST /api/diary — upsert записи на день. */
export const POST = withApiHandler("diary.save", async (req, { logger }) => {
  const user = await requireUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = diaryEntrySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }
  const { date, mood, sleepHours, energyLevel, notes } = parsed.data;

  let dateObj: Date;
  try {
    dateObj = startOfDayUTC(date);
  } catch {
    return apiError("Некорректная дата", 400);
  }

  const crisis = detectCrisis(notes);
  const notesCipher = notes ? encrypt(notes) : "";

  const entry = await db.diaryEntry.upsert({
    where: { userId_date: { userId: user.id, date: dateObj } },
    create: {
      userId: user.id,
      date: dateObj,
      mood,
      sleepHours: sleepHours ?? null,
      energyLevel: energyLevel ?? null,
      notesCipher,
      crisisDetected: crisis.detected,
    },
    update: {
      mood,
      sleepHours: sleepHours ?? null,
      energyLevel: energyLevel ?? null,
      notesCipher,
      crisisDetected: crisis.detected,
    },
  });

  logger.info("diary.save.success", { userId: user.id, date, crisisDetected: crisis.detected });
  return NextResponse.json({
    entry: {
      id: entry.id,
      date: entry.date.toISOString(),
      mood: entry.mood,
      sleepHours: entry.sleepHours,
      energyLevel: entry.energyLevel,
      notes,
      crisisDetected: entry.crisisDetected,
    },
  });
});
