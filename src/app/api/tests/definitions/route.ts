import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/tests/definitions — список тестов.
 * Помечает рекомендованные на основе conditionTags пользователя + последние прохождения.
 */
export async function GET() {
  const user = await getCurrentUser();

  const definitions = await db.testDefinition.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      periodicityDays: true,
      category: true,
      version: true,
      _count: { select: { questions: true } },
    },
  });

  // Рекомендованные коды тестов из тегов пользователя.
  let recommendedCodes = new Set<string>();
  let lastResponses: Record<string, { completedAt: string; totalScore: number; severity: string; label: string } | undefined> = {};
  if (user) {
    const tags = await db.userConditionTag.findMany({
      where: { userId: user.id },
      include: { conditionTag: true },
    });
    for (const t of tags) {
      try {
        const codes = JSON.parse(t.conditionTag.recommendedTestCodes) as string[];
        codes.forEach((c) => recommendedCodes.add(c));
      } catch {
        /* ignore */
      }
    }

    // Последнее прохождение по каждому тесту.
    const responses = await db.testResponse.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: "desc" },
      select: {
        testDefinitionId: true,
        completedAt: true,
        totalScore: true,
        interpretedSeverity: true,
        interpretedLabel: true,
        testDefinition: { select: { code: true } },
      },
    });
    for (const r of responses) {
      const code = r.testDefinition.code;
      if (!lastResponses[code]) {
        lastResponses[code] = {
          completedAt: r.completedAt.toISOString(),
          totalScore: r.totalScore,
          severity: r.interpretedSeverity,
          label: r.interpretedLabel,
        };
      }
    }
  }

  const result = definitions.map((d) => {
    const last = lastResponses[d.code];
    const due = last
      ? Date.now() - new Date(last.completedAt).getTime() > d.periodicityDays * 24 * 60 * 60 * 1000
      : true;
    return {
      ...d,
      recommended: recommendedCodes.has(d.code),
      lastResponse: last ?? null,
      due,
    };
  });

  return NextResponse.json({ definitions: result });
}
