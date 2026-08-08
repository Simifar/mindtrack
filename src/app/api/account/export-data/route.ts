import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { decryptSafe } from "@/lib/crypto";
import { withApiHandler } from "@/lib/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/account/export-data — экспорт ВСЕХ данных пользователя в JSON.
 * Право на портативность данных (GDPR / 152-ФЗ). Расшифровывает заметки и ответы.
 */
export const GET = withApiHandler("account.exportData", async (_req, { logger }) => {
  const user = await requireUser();

  const [conditionTags, testResponses, diaryEntries, medications, exportLogs] = await Promise.all([
    db.userConditionTag.findMany({
      where: { userId: user.id },
      include: { conditionTag: true },
    }),
    db.testResponse.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: "asc" },
      include: { testDefinition: { select: { code: true, name: true } } },
    }),
    db.diaryEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    }),
    db.medication.findMany({
      where: { userId: user.id },
      include: { logs: true },
    }),
    db.exportLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      timezone: user.timezone,
      consentAcceptedAt: user.consentAcceptedAt,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
    },
    conditionTags: conditionTags.map((t) => ({
      code: t.conditionTag.code,
      name: t.conditionTag.name,
    })),
    testResponses: testResponses.map((r) => ({
      test: r.testDefinition,
      completedAt: r.completedAt,
      totalScore: r.totalScore,
      severity: r.interpretedSeverity,
      label: r.interpretedLabel,
      answers: r.answersCipher ? (() => { try { return JSON.parse(decryptSafe(r.answersCipher)); } catch { return null; } })() : null,
    })),
    diaryEntries: diaryEntries.map((e) => ({
      date: e.date,
      mood: e.mood,
      sleepHours: e.sleepHours,
      energyLevel: e.energyLevel,
      notes: e.notesCipher ? decryptSafe(e.notesCipher) : "",
      customFields: e.customFieldsJson ? (e.customFieldsJson as Record<string, unknown>) : {},
      crisisDetected: e.crisisDetected,
      createdAt: e.createdAt,
    })),
    medications: medications.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      schedule: m.schedule,
      active: m.active,
      logs: m.logs.map((l) => ({ takenAt: l.takenAt, note: l.note })),
    })),
    exportLogs: exportLogs.map((l) => ({
      dateRangeFrom: l.dateRangeFrom,
      dateRangeTo: l.dateRangeTo,
      includedSections: l.includedSections as string[],
      createdAt: l.createdAt,
      hasShareLink: !!l.shareToken,
      expiresAt: l.expiresAt,
    })),
  };

  logger.info("account.exportData.success", { userId: user.id });
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mindtrack-data-${user.email}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
