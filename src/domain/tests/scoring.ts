import { validateAnswers } from "./validation";
import { getOptions } from "./scoring-options";
import type { ScoreResult, TestDefinition } from "./types";

function scoreValue(def: TestDefinition, questionIndex: number, value: number): number {
  if (def.scoring.mode !== "sum" || !def.scoring.reverseQuestionIndexes?.includes(questionIndex)) return value;
  const values = getOptions(def, questionIndex).map((option) => option.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min + max - value;
}

/** Чистый подсчёт результата по ответам (индекс вопроса → значение). */
export function scoreTest(def: TestDefinition, answers: Record<number, number>): ScoreResult {
  const safeAnswers = validateAnswers(def, answers).answers;
  const values = def.questions.map((_, index) => safeAnswers[index] ?? 0);
  const crisisDetected = (def.scoring.crisisQuestionIndexes ?? []).some((index) => (values[index] ?? 0) > 0);

  if (def.scoring.mode === "threshold") {
    const scoring = def.scoring;
    const thresholds = scoring.itemThresholds ?? values.map(() => scoring.minValuePerItem ?? 1);
    const count = values.filter((value, index) => value >= (thresholds[index] ?? thresholds[thresholds.length - 1] ?? 1)).length;
    const positive = count >= (scoring.minItemsMeetingThreshold ?? 1);
    return {
      totalScore: count,
      severity: positive ? (scoring.positiveSeverity ?? "positive") : (scoring.negativeSeverity ?? "negative"),
      label: positive ? (scoring.positiveLabel ?? "Положительный") : (scoring.negativeLabel ?? "Отрицательный"),
      advice: positive ? (scoring.positiveAdvice ?? "") : (scoring.negativeAdvice ?? ""),
      crisisDetected,
    };
  }

  if (def.scoring.mode === "mdq") {
    const symptomCount = values.slice(0, 13).filter((value) => value > 0).length;
    const coOccurred = values[13] > 0;
    const impact = values[14] ?? 0;
    const positive = symptomCount >= (def.scoring.minItemsMeetingThreshold ?? 7) && coOccurred && impact >= 2;
    const needsContext = !positive && symptomCount >= (def.scoring.minItemsMeetingThreshold ?? 7);
    return {
      totalScore: symptomCount,
      severity: positive ? (def.scoring.positiveSeverity ?? "positive") : needsContext ? "context" : (def.scoring.negativeSeverity ?? "negative"),
      label: positive ? (def.scoring.positiveLabel ?? "Положительный") : needsContext ? "Нужен дополнительный контекст" : (def.scoring.negativeLabel ?? "Отрицательный"),
      advice: positive
        ? (def.scoring.positiveAdvice ?? "")
        : needsContext
          ? `Отмечено ${symptomCount} из 13 симптомов, но положительный скрининг MDQ требует также совпадения симптомов по времени и как минимум умеренного влияния на жизнь. Проверьте эти ответы и обсудите результат с психиатром — это не диагноз.`
          : (def.scoring.negativeAdvice ?? ""),
      crisisDetected,
      details: { symptomCount, coOccurred, impact },
    };
  }

  const total = values.reduce((sum, value, index) => sum + scoreValue(def, index, value), 0);
  const bands = def.scoring.bands ?? [];
  const band = bands.find((item) => total <= item.max) ?? bands[bands.length - 1] ?? {
    severity: "none" as const,
    label: "—",
    advice: "",
  };
  return {
    totalScore: total,
    severity: band.severity,
    label: band.label,
    advice: band.advice,
    crisisDetected,
    normalizedScore: def.scoring.normalizedScore ? total * def.scoring.normalizedScore.multiplier : undefined,
  };
}

/** Максимально возможный балл теста (для подписи «12 / 27»). */
export function getMaxScore(def: TestDefinition): number {
  if (def.scoring.mode !== "sum" && def.scoring.displayMaxScore !== undefined) return def.scoring.displayMaxScore;
  const optMax = Math.max(...def.options.map((option) => option.value));
  const scoredQuestionCount = def.scoring.mode === "mdq" ? Math.min(13, def.questions.length) : def.questions.length;
  return optMax * scoredQuestionCount;
}

export const maxScore = getMaxScore;
