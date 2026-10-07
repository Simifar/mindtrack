"use client";

import type { ScoreResult, TestDefinition } from "@/data/tests";
import { severityColor } from "@/lib/results";
import { cn } from "@/lib/utils";

interface ScaleSegment {
  from: number;
  to: number;
  label: string;
  color: string;
}

/** Диапазоны опубликованной шкалы методики. Пусто — у формы нет диапазонов (пороговые формы). */
export function scaleSegments(def: TestDefinition): ScaleSegment[] {
  if (def.scoring.mode !== "sum" || !def.scoring.bands?.length) return [];
  let from = 0;
  return def.scoring.bands.map((band) => {
    const segment = { from, to: band.max, label: band.label, color: severityColor(band.severity) };
    from = band.max + 1;
    return segment;
  });
}

/** Порог пороговых форм (ASRS, MDQ): сколько критериев нужно для положительного скрининга. */
function thresholdOf(def: TestDefinition): { needed: number; total: number } | null {
  if (def.scoring.mode === "threshold" || def.scoring.mode === "mdq") {
    const needed = def.scoring.minItemsMeetingThreshold;
    const total = def.scoring.displayMaxScore;
    if (needed && total) return { needed, total };
  }
  return null;
}

/**
 * Положение балла на шкале методики. Цвет дублируется текстом легенды,
 * поэтому визуальная полоса скрыта от скринридеров.
 */
export function ScoreScale({ def, score, max }: { def: TestDefinition; score: ScoreResult; max: number }) {
  const value = score.totalScore;
  const segments = scaleSegments(def);
  const threshold = thresholdOf(def);

  if (threshold) {
    const cells = Array.from({ length: threshold.total }, (_, index) => index);
    return (
      <figure className="space-y-2.5">
        <div aria-hidden="true" className="flex gap-1">
          {cells.map((index) => (
            <span
              key={index}
              className={cn(
                "h-3 flex-1 rounded-full",
                index === threshold.needed && "ml-2",
                index < value ? "" : "bg-muted",
              )}
              style={index < value ? { backgroundColor: severityColor(score.severity) } : undefined}
            />
          ))}
        </div>
        <figcaption className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Отмечено <span className="font-medium tabular-nums text-foreground">{value}</span> из{" "}
            <span className="tabular-nums">{threshold.total}</span>
          </span>
          <span>
            Порог формы: <span className="tabular-nums">{threshold.needed}</span> и больше
            {def.scoring.mode === "mdq" ? " + дополнительные условия" : ""}
          </span>
        </figcaption>
      </figure>
    );
  }

  const total = Math.max(1, (segments.at(-1)?.to ?? max) + 1);
  const markerLeft = `${Math.min(100, Math.max(0, ((value + 0.5) / total) * 100))}%`;
  const activeIndex = segments.findIndex((segment) => value >= segment.from && value <= segment.to);
  const color = severityColor(score.severity);

  return (
    <figure className="space-y-3">
      <div aria-hidden="true" className="relative pt-3">
        <span
          className="absolute top-0 h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent"
          style={{ left: markerLeft, borderTopColor: "var(--foreground)" }}
        />
        <div className="flex h-3 gap-[3px] overflow-hidden rounded-full">
          {segments.length > 0 ? (
            segments.map((segment, index) => (
              <span
                key={segment.label}
                className="h-full transition-opacity"
                style={{
                  flexGrow: segment.to - segment.from + 1,
                  flexBasis: 0,
                  backgroundColor: segment.color,
                  opacity: index === activeIndex ? 1 : 0.22,
                }}
              />
            ))
          ) : (
            <span className="h-full flex-1 bg-muted">
              <span className="block h-full rounded-full" style={{ width: markerLeft, backgroundColor: color }} />
            </span>
          )}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>0</span>
          <span>{total - 1}</span>
        </div>
      </div>
      {segments.length > 1 ? (
        <figcaption>
          <p className="sr-only">Диапазоны шкалы {def.short}</p>
          <ol className="grid gap-1 text-xs sm:grid-cols-2">
            {segments.map((segment, index) => {
              const active = index === activeIndex;
              return (
                <li
                  key={segment.label}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex items-baseline gap-2 rounded-lg px-2 py-1",
                    active ? "bg-surface font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span aria-hidden="true" className="mt-0.5 h-2 w-2 shrink-0 self-center rounded-full" style={{ backgroundColor: segment.color, opacity: active ? 1 : 0.5 }} />
                  <span className="w-11 shrink-0 tabular-nums">{segment.from}–{segment.to}</span>
                  <span className="min-w-0">
                    {segment.label}
                    {active ? <span className="sr-only"> — ваш диапазон</span> : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </figcaption>
      ) : null}
    </figure>
  );
}
