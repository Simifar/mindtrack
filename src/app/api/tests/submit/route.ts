import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { submitTestSchema, apiError } from "@/lib/validation";
import { scoreTest, type AnswerValue } from "@/lib/test-scoring";
import { encrypt } from "@/lib/crypto";
import { detectCrisis } from "@/lib/crisis";
import { withApiHandler } from "@/lib/route-handler";

/** POST /api/tests/submit — принимает ответы, считает балл (сервер), сохраняет зашифрованно. */
export const POST = withApiHandler("tests.submit", async (req, { logger }) => {
  const user = await requireUser();

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

  // Валидация ответов по вопросам теста.
  const answeredIds = new Set<string>();
  const allowedQuestionIds = new Set(def.questions.map((q) => q.id));

  for (const a of answers) {
    if (!allowedQuestionIds.has(a.questionId)) {
      return apiError("Ответ на неизвестный вопрос", 400);
    }
    if (answeredIds.has(a.questionId)) {
      return apiError("Дублирующийся ответ на вопрос", 400);
    }
    answeredIds.add(a.questionId);
  }

  const missingQuestions = def.questions.filter((q) => !q.isFreeText && !answeredIds.has(q.id));
  if (missingQuestions.length > 0) {
    return apiError(
      "Не на все обязательные вопросы даны ответы",
      400,
      missingQuestions.map((q) => q.text)
    );
  }

  for (const a of answers) {
    const question = def.questions.find((q) => q.id === a.questionId);
    if (!question) continue;
    if (question.isFreeText) {
      if (typeof a.value !== "string") {
        return apiError("Открытый ответ должен быть текстом", 400);
      }
      if (a.value.length > 2000) {
        return apiError("Открытый ответ слишком длинный (максимум 2000 символов)", 400);
      }
      continue;
    }
    if (typeof a.value !== "number") {
      return apiError("Ответ должен быть числом", 400);
    }
    const options = question.optionsJson as { value: number; label: string }[];
    if (!options.some((o) => o.value === a.value)) {
      return apiError("Недопустимое значение ответа", 400);
    }
  }

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

  logger.info("tests.submit.success", {
    userId: user.id,
    testDefinitionId: def.id,
    responseId: response.id,
    totalScore: result.totalScore,
    severity: result.severity,
    crisisDetected: result.crisisDetected || crisisFromFreeText,
  });
  return NextResponse.json({
    responseId: response.id,
    totalScore: result.totalScore,
    severity: result.severity,
    label: result.label,
    crisisDetected: result.crisisDetected || crisisFromFreeText,
  });
});
