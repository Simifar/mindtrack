import { ALL_TESTS, type TestDefinition } from "@/data/tests";
import { getResultCompleteness, type SavedResult } from "@/lib/results";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Русское склонение после числа: 1 день, 2 дня, 5 дней. */
export function plural(count: number, forms: [string, string, string]): string {
  const n = Math.abs(count) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Полные календарные дни между датой и «сейчас» по локальному времени. */
export function daysSince(iso: string, now: Date): number {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 0;
  return Math.max(0, Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS));
}

export function formatRelativeDay(iso: string, now: Date): string {
  const days = daysSince(iso, now);
  if (days === 0) return "сегодня";
  if (days === 1) return "вчера";
  if (days < 7) return `${days} ${plural(days, ["день", "дня", "дней"])} назад`;
  const date = new Date(iso);
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("ru-RU", sameYear ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Рекомендуемая периодичность из описания методики («раз в 2 недели»,
 * «раз в месяц», «раз в 3 месяца») в днях. Неизвестный формат — null:
 * тогда приложение не предлагает повтор вовсе.
 */
export function periodicityDays(def: Pick<TestDefinition, "periodicity">): number | null {
  const match = def.periodicity.match(/раз в\s+(\d+)?\s*(недел|месяц|день|дн)/i);
  if (!match) return null;
  const count = match[1] ? Number(match[1]) : 1;
  const unit = match[2].toLowerCase();
  if (unit.startsWith("недел")) return count * 7;
  if (unit.startsWith("месяц")) return count * 30;
  return count;
}

export interface TestSummary {
  def: TestDefinition;
  /** Последняя запись, в том числе неполная. */
  latest: SavedResult;
  latestComplete: SavedResult | null;
  previousComplete: SavedResult | null;
  /** Полные результаты от старых к новым — для графика динамики. */
  completeSeries: SavedResult[];
  count: number;
  /** Прошло не меньше рекомендуемого интервала с последнего полного прохождения. */
  dueForRepeat: boolean;
}

/** Сводка истории по методикам: только тесты, у которых есть записи, свежие сверху. */
export function summarizeResults(results: SavedResult[], now: Date): TestSummary[] {
  const summaries: TestSummary[] = [];
  for (const def of ALL_TESTS) {
    const own = results
      .filter((result) => result.code === def.code)
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
    if (own.length === 0) continue;
    const complete = own.filter((result) => result.totalScore !== null && getResultCompleteness(result) === "complete");
    const interval = periodicityDays(def);
    const latestComplete = complete[0] ?? null;
    summaries.push({
      def,
      latest: own[0],
      latestComplete,
      previousComplete: complete[1] ?? null,
      completeSeries: complete.slice().reverse(),
      count: own.length,
      dueForRepeat: Boolean(latestComplete && interval !== null && daysSince(latestComplete.dateISO, now) >= interval),
    });
  }
  return summaries.sort((a, b) => b.latest.dateISO.localeCompare(a.latest.dateISO));
}

/** Изменение балла без оценочных слов: только направление и величина. */
export function describeDelta(
  current: number | null,
  previous: number | null,
  forms: [string, string, string] = ["балл", "балла", "баллов"],
): string | null {
  if (current === null || previous === null) return null;
  const delta = current - previous;
  if (delta === 0) return "без изменений";
  const size = Math.abs(delta);
  return `на ${size} ${plural(size, forms)} ${delta > 0 ? "выше" : "ниже"}`;
}

/** Формы единицы для текста об изменении: «баллов», «критериев», «симптомов». */
export function unitForms(def: Pick<TestDefinition, "scoreUnit">): [string, string, string] {
  if (def.scoreUnit === "критериев") return ["критерий", "критерия", "критериев"];
  if (def.scoreUnit === "симптомов") return ["симптом", "симптома", "симптомов"];
  return ["балл", "балла", "баллов"];
}
