import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** GET /api/tests/[id] — полное определение теста с вопросами и вариантами. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const def = await db.testDefinition.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!def) {
    return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
  }

  // Раскрываем optionsJson, но НЕ отдаём scoringRule клиенту (сервер считает сам).
  const user = await getCurrentUser();
  const questions = def.questions.map((q) => ({
    id: q.id,
    order: q.order,
    text: q.text,
    isFreeText: q.isFreeText,
    options: q.isFreeText ? [] : (JSON.parse(q.optionsJson) as { value: number; label: string }[]),
  }));

  // Последние прохождения для тренда.
  let history: { completedAt: string; totalScore: number; severity: string; label: string }[] = [];
  if (user) {
    const responses = await db.testResponse.findMany({
      where: { userId: user.id, testDefinitionId: id },
      orderBy: { completedAt: "desc" },
      take: 30,
      select: {
        completedAt: true,
        totalScore: true,
        interpretedSeverity: true,
        interpretedLabel: true,
      },
    });
    history = responses.map((r) => ({
      completedAt: r.completedAt.toISOString(),
      totalScore: r.totalScore,
      severity: r.interpretedSeverity,
      label: r.interpretedLabel,
    }));
  }

  return NextResponse.json({
    definition: {
      id: def.id,
      code: def.code,
      name: def.name,
      description: def.description,
      periodicityDays: def.periodicityDays,
      category: def.category,
      version: def.version,
    },
    questions,
    history,
  });
}
