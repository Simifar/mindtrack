import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

/**
 * GET /api/tests/history?testDefinitionId=...&limit=50 — история прохождений теста.
 * Без testDefinitionId — все последние прохождения пользователя.
 */
export async function GET(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    throw e;
  }
  const url = new URL(req.url);
  const testDefinitionId = url.searchParams.get("testDefinitionId");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

  const responses = await db.testResponse.findMany({
    where: { userId: user.id, ...(testDefinitionId ? { testDefinitionId } : {}) },
    orderBy: { completedAt: "desc" },
    take: limit,
    include: {
      testDefinition: { select: { id: true, code: true, name: true } },
    },
  });

  const items = responses.map((r) => {
    let answers: unknown = null;
    try {
      answers = JSON.parse(decrypt(r.answersCipher));
    } catch {
      answers = null;
    }
    return {
      id: r.id,
      completedAt: r.completedAt.toISOString(),
      totalScore: r.totalScore,
      severity: r.interpretedSeverity,
      label: r.interpretedLabel,
      test: r.testDefinition,
      answers,
    };
  });

  return NextResponse.json({ items });
}
