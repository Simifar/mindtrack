import { getOptions } from "./scoring-options";
import type { TestDefinition } from "./types";

export interface AnswerValidation {
  valid: boolean;
  errors: string[];
  answers: Record<number, number>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateAnswers(
  def: TestDefinition,
  answers: unknown,
  options: { requireComplete?: boolean } = {},
): AnswerValidation {
  if (!isRecord(answers)) {
    return { valid: false, errors: ["Ответы должны быть объектом"], answers: {} };
  }

  const errors: string[] = [];
  const validAnswers: Record<number, number> = {};
  for (const [key, value] of Object.entries(answers)) {
    const questionIndex = Number(key);
    const optionsForQuestion = Number.isInteger(questionIndex) && questionIndex >= 0 && questionIndex < def.questions.length
      ? getOptions(def, questionIndex)
      : [];
    if (
      !/^\d+$/.test(key) ||
      !Number.isInteger(questionIndex) ||
      questionIndex < 0 ||
      questionIndex >= def.questions.length ||
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      !optionsForQuestion.some((option) => option.value === value)
    ) {
      errors.push(`Недопустимый ответ для вопроса ${key}`);
      continue;
    }
    validAnswers[questionIndex] = value;
  }

  if (options.requireComplete) {
    for (let index = 0; index < def.questions.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(validAnswers, index)) errors.push(`Нет ответа на вопрос ${index}`);
    }
  }

  return { valid: errors.length === 0, errors, answers: validAnswers };
}
