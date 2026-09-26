import { getOptions } from "./scoring-options";
import { getMaxScore } from "./scoring";
import { validateAnswers } from "./validation";
import type { ScoreResult, TestDefinition } from "./types";

export function formatScore(def: TestDefinition, result: ScoreResult): string {
  const unit = def.scoreUnit ? ` ${def.scoreUnit}` : "";
  return `${result.totalScore} из ${getMaxScore(def)}${unit}`;
}

/** Текстовый экспорт результата — для отправки врачу / себе. */
export function formatResultText(opts: {
  def: TestDefinition;
  answers: Record<number, number>;
  result?: ScoreResult;
  date: Date;
}): string {
  const { def, answers, result, date } = opts;
  const validation = validateAnswers(def, answers, { requireComplete: true });
  const complete = validation.valid;
  const lines: string[] = [];
  lines.push("MindTrack — результат самонаблюдения (НЕ диагноз)");
  lines.push(`${def.name}`);
  lines.push(`Дата: ${date.toLocaleString("ru-RU")}`);
  if (!complete) {
    lines.push(`Неполный результат: ${Object.keys(validation.answers).length} из ${def.questions.length} ответов. Балл, категория и рекомендации не рассчитываются.`);
  } else if (result) {
    lines.push(`Балл: ${formatScore(def, result)} — ${result.label}`);
  }
  if (complete && result?.normalizedScore !== undefined && def.scoring.mode === "sum" && def.scoring.normalizedScore) {
    lines.push(`Нормированный результат WHO-5: ${result.normalizedScore} ${def.scoring.normalizedScore.label}`);
  }
  if (complete && result?.details) {
    lines.push(`Условия MDQ: ${result.details.symptomCount} из 13 симптомов; совпадение по времени — ${result.details.coOccurred ? "да" : "нет"}; влияние — ${result.details.impact}/3.`);
  }
  if (complete && result?.advice) lines.push(`Рекомендация: ${result.advice}`);
  lines.push("");
  lines.push("Ответы:");
  def.questions.forEach((question, index) => {
    const option = getOptions(def, index).find((item) => item.value === answers[index]);
    lines.push(`${index + 1}. ${question} — ${option ? `${option.label} (${option.value})` : "—"}`);
  });
  lines.push("");
  lines.push(`Источник шкалы: ${def.source}`);
  lines.push(`Источник и сведения о версии: ${def.sourceInfo.url}`);
  lines.push("Это не оценка риска и не диагноз. В непосредственной опасности звоните 112.");
  return lines.join("\n");
}
