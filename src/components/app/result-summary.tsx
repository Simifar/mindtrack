"use client";

import type { ScoreResult, TestDefinition } from "@/data/tests";
import { severityColor } from "@/lib/results";
import { describeDelta, unitForms } from "@/lib/insights";
import { ScoreScale } from "@/components/app/score-scale";

export interface PreviousScore {
  totalScore: number | null;
  dateISO: string;
}

/**
 * Балл, категория, положение на шкале методики и сравнение с прошлым прохождением.
 * Один и тот же блок используется на экране результата и в истории,
 * чтобы формулировки и вид не расходились.
 */
export function ResultSummary({
  def,
  score,
  max,
  previous,
}: {
  def: TestDefinition;
  score: ScoreResult;
  max: number;
  previous?: PreviousScore | null;
}) {
  const color = severityColor(score.severity);
  const value = score.totalScore;
  const previousValue = previous?.totalScore ?? null;
  const delta = describeDelta(value, previousValue, unitForms(def));

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="score-figure">{value}</span>
          <span className="text-base text-muted-foreground">
            из <span className="tabular-nums">{max}</span>
            {def.scoreUnit ? ` ${def.scoreUnit}` : ""}
          </span>
        </p>
        <p className="flex items-start gap-2.5 text-xl font-semibold leading-snug tracking-tight">
          <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span>{score.label}</span>
        </p>
      </div>

      <ScoreScale def={def} score={score} max={max} />

      {score.advice ? (
        <p
          className="rounded-xl border-l-[3px] bg-surface px-4 py-3 text-sm leading-relaxed text-foreground/90"
          style={{ borderLeftColor: color }}
        >
          {score.advice}
        </p>
      ) : null}

      {score.normalizedScore !== undefined && def.scoring.mode === "sum" && def.scoring.normalizedScore ? (
        <p className="text-sm text-muted-foreground">
          Нормированный результат WHO-5: <strong className="tabular-nums text-foreground">{score.normalizedScore}</strong>{" "}
          {def.scoring.normalizedScore.label}
        </p>
      ) : null}

      {def.code === "MDQ" && score.details ? (
        <div className="rounded-xl bg-surface p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Условия скрининга MDQ</p>
          <p className="mt-1">
            Симптомы: <span className="tabular-nums">{score.details.symptomCount}</span> из 13 · совпадение по времени:{" "}
            {score.details.coOccurred ? "да" : "нет"} · влияние на жизнь:{" "}
            <span className="tabular-nums">{score.details.impact}</span>/3.
          </p>
        </div>
      ) : null}

      {delta && previous && previousValue !== null ? (
        <p className="text-sm text-muted-foreground">
          Прошлый раз ({new Date(previous.dateISO).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}):{" "}
          <span className="font-medium tabular-nums text-foreground">{previousValue}</span> · сейчас{" "}
          <span className="tabular-nums">{delta}</span>
        </p>
      ) : null}
    </div>
  );
}
