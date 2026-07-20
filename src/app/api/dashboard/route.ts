import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { decryptSafe } from "@/lib/crypto";

/**
 * GET /api/dashboard — сводка для дашборда:
 *  - последние результаты тестов
 *  - график настроения за 30 дней
 *  - напоминания (какие тесты «просрочены»)
 */
export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    throw e;
  }

  const now = new Date();
  const from30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [diaryEntries, recentResponses, definitions] = await Promise.all([
    db.diaryEntry.findMany({
      where: { userId: user.id, date: { gte: from30 } },
      orderBy: { date: "asc" },
    }),
    db.testResponse.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: "desc" },
      take: 10,
      include: { testDefinition: { select: { id: true, code: true, name: true, periodicityDays: true } } },
    }),
    db.testDefinition.findMany({
      select: { id: true, code: true, name: true, periodicityDays: true },
    }),
  ]);

  // Последнее прохождение каждого теста — для напоминаний.
  const lastByDef = new Map<string, { completedAt: Date; totalScore: number; severity: string; label: string }>();
  for (const r of recentResponses) {
    const key = r.testDefinition.code;
    if (!lastByDef.has(key)) {
      lastByDef.set(key, {
        completedAt: r.completedAt,
        totalScore: r.totalScore,
        severity: r.interpretedSeverity,
        label: r.interpretedLabel,
      });
    }
  }

  const reminders = definitions.map((d) => {
    const last = lastByDef.get(d.code);
    const due = last
      ? now.getTime() - last.completedAt.getTime() > d.periodicityDays * 24 * 60 * 60 * 1000
      : true;
    return {
      id: d.id,
      code: d.code,
      name: d.name,
      periodicityDays: d.periodicityDays,
      lastCompletedAt: last?.completedAt.toISOString() ?? null,
      due,
    };
  });

  const moodSeries = diaryEntries.map((e) => ({
    date: e.date.toISOString(),
    mood: e.mood,
    sleepHours: e.sleepHours,
    energyLevel: e.energyLevel,
    notes: e.notesCipher ? decryptSafe(e.notesCipher) : "",
    crisisDetected: e.crisisDetected,
  }));

  // Последние результаты тестов (для карточек).
  const latestTests = recentResponses.slice(0, 5).map((r) => ({
    id: r.id,
    completedAt: r.completedAt.toISOString(),
    totalScore: r.totalScore,
    severity: r.interpretedSeverity,
    label: r.interpretedLabel,
    test: r.testDefinition,
  }));

  // Средние показатели за период.
  const avgMood = moodSeries.length
    ? moodSeries.reduce((s, x) => s + x.mood, 0) / moodSeries.length
    : null;
  const avgSleep = moodSeries.length
    ? moodSeries.reduce((s, x) => s + (x.sleepHours ?? 0), 0) / moodSeries.length
    : null;
  const diaryDays = moodSeries.length;

  return NextResponse.json({
    moodSeries,
    latestTests,
    reminders,
    stats: {
      avgMood: avgMood !== null ? Math.round(avgMood * 10) / 10 : null,
      avgSleep: avgSleep !== null ? Math.round(avgSleep * 10) / 10 : null,
      diaryDays,
      totalTests: recentResponses.length,
    },
  });
}
