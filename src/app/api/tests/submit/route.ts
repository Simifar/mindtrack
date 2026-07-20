import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { submitTestSchema, apiError } from "@/lib/validation";
import { scoreTest, type AnswerValue } from "@/lib/test-scoring";
import { encrypt } from "@/lib/crypto";
import { detectCrisis } from "@/lib/crisis";

/** POST /api/tests/submit — принимает ответы, считает балл (сервер), сохраняет зашифрованно. */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return apiError("Не авторизован", 401);
    throw e;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Некорректный JSON", 400);
  }
  const parsed = submitTestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Ошибка валидации", 400, parsed.error.flatten().fieldErrors);
  }
  const { testDefinitionId, answers } = parsed.data;

  const def = await db.testDefinition.findUnique({
    where: { id: testDefinitionId },
    include: { questions: true },
  });
  if (!def) return apiError("Тест не найден", 404);

  // Серверный подсчёт по scoringRuleJson (клиент НЕ получает правило).
  const result = scoreTest(
    def.scoringRuleJson,
    answers as AnswerValue[],
    def.questions.map((q) => ({
      id: q.id,
      order: q.order,
      text: q.text,
      optionsJson: q.optionsJson,
      isFreeText: q.isFreeText,
    }))
  );

  // Доп. кризис-детекция по открытым ответам.
  let crisisFromFreeText = false;
  for (const a of answers) {
    if (typeof a.value === "string" && a.value.trim().length > 0) {
      const q = def.questions.find((qq) => qq.id === a.questionId);
      if (q?.isFreeText && detectCrisis(a.value).detected) {
        crisisFromFreeText = true;
      }
    }
  }

  const answersCipher = encrypt(JSON.stringify(answers));

  const response = await db.testResponse.create({
    data: {
      userId: user.id,
      testDefinitionId: def.id,
      answersCipher,
      totalScore: result.totalScore,
      interpretedSeverity: result.severity,
      interpretedLabel: result.label,
    },
  });

  return NextResponse.json({
    responseId: response.id,
    totalScore: result.totalScore,
    severity: result.severity,
    label: result.label,
    crisisDetected: result.crisisDetected || crisisFromFreeText,
  });
}
