"use client";

import type { ScoreResult, TestDefinition } from "@/data/tests";
import { Progress } from "@/components/ui/progress";
import { severityColor } from "@/lib/results";

export interface PreviousScore {
  totalScore: number | null;
  dateISO: string;
}

/**
 * Балл, положение на шкале, категория и сравнение с прошлым прохождением.
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
  const percent = max > 0 && value !== null ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const previousValue = previous?.totalScore ?? null;
  const delta = value !== null && previousValue !== null ? value - previousValue : null;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-semibold leading-none tabular-nums">{value}</span>
          <span className="pb-1 text-base text-muted-foreground">
            из {max}
            {def.scoreUnit ? ` ${def.scoreUnit}` : ""}
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          <Progress
            value={percent}
            className="h-2.5 bg-muted"
            indicatorStyle={{ backgroundColor: color }}
            aria-valuetext={`Балл ${value} из ${max}`}
          />
          <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>0</span>
            <span>{max}</span>
          </div>
        </div>
      </div>

      {delta !== null && previous ? (
        <p className="text-sm text-muted-foreground">
          Предыдущий результат: <span className="font-medium tabular-nums text-foreground">{previousValue}</span>{" "}
          ({new Date(previous.dateISO).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}) ·{" "}
          <span className="tabular-nums">
            {delta === 0 ? "без изменений" : delta > 0 ? `на ${delta} больше` : `на ${Math.abs(delta)} меньше`}
          </span>
        </p>
      ) : null}

      {score.normalizedScore !== undefined && def.scoring.mode === "sum" && def.scoring.normalizedScore ? (
        <p className="text-sm text-muted-foreground">
          Нормированный результат WHO-5: <strong className="tabular-nums">{score.normalizedScore}</strong>{" "}
          {def.scoring.normalizedScore.label}
        </p>
      ) : null}

      {def.code === "MDQ" && score.details ? (
        <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Условия скрининга MDQ</p>
          <p className="mt-1">
            Симптомы: <span className="tabular-nums">{score.details.symptomCount}</span> из 13 · совпадение по времени:{" "}
            {score.details.coOccurred ? "да" : "нет"} · влияние на жизнь:{" "}
            <span className="tabular-nums">{score.details.impact}</span>/3.
          </p>
        </div>
      ) : null}

      <div
        className="rounded-xl border p-4"
        style={{
          borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
          backgroundColor: `color-mix(in oklab, ${color} 10%, var(--card))`,
        }}
      >
        <p className="text-lg font-semibold" style={{ color }}>
          {score.label}
        </p>
        {score.advice ? <p className="mt-1 text-sm leading-relaxed text-foreground/85">{score.advice}</p> : null}
      </div>
    </div>
  );
}
