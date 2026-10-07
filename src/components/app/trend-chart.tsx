"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface TrendPoint {
  id: string;
  dateISO: string;
  value: number;
  /** Подпись для таблицы скринридера, например категория результата. */
  note?: string;
}

export interface TrendBand {
  from: number;
  to: number;
  color: string;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function pointPosition(index: number, count: number, value: number, min: number, max: number) {
  const x = count <= 1 ? 50 : (index / (count - 1)) * 100;
  const span = Math.max(1, max - min);
  const y = 100 - ((value - min) / span) * 100;
  return { x, y: Math.min(100, Math.max(0, y)) };
}

/**
 * График динамики балла. Линии рисуются в растягиваемом SVG, а точки и подписи —
 * HTML поверх него, чтобы не искажались на узких экранах. Для скринридеров
 * дублируется таблицей.
 */
export function TrendChart({
  title,
  points,
  min = 0,
  max,
  unit,
  bands = [],
  className,
}: {
  title: string;
  points: TrendPoint[];
  min?: number;
  max: number;
  unit: string;
  bands?: TrendBand[];
  className?: string;
}) {
  const captionId = useId();
  if (points.length === 0) return null;
  const positions = points.map((point, index) => pointPosition(index, points.length, point.value, min, max));
  const path = positions.map((p, index) => `${index === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${path} L${positions[positions.length - 1].x},100 L${positions[0].x},100 Z`;
  const showEveryLabel = points.length <= 6;

  return (
    <figure aria-labelledby={captionId} className={cn("space-y-3", className)}>
      <figcaption id={captionId} className="sr-only">{title}</figcaption>
      <div aria-hidden="true" className="relative ml-7 mr-2 h-40 sm:h-48">
        <div className="absolute inset-0">
          {bands.map((band) => {
            const top = pointPosition(0, 1, band.to + 1, min, max).y;
            const bottom = pointPosition(0, 1, band.from, min, max).y;
            return (
              <span
                key={`${band.from}-${band.to}`}
                className="absolute inset-x-0"
                style={{ top: `${top}%`, height: `${Math.max(0, bottom - top)}%`, backgroundColor: band.color, opacity: 0.07 }}
              />
            );
          })}
          {[0, 0.5, 1].map((ratio) => (
            <span key={ratio} className="absolute inset-x-0 border-t border-dashed border-border" style={{ top: `${ratio * 100}%` }} />
          ))}
        </div>
        <span className="absolute -left-7 top-0 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground">{max}</span>
        <span className="absolute -left-7 bottom-0 translate-y-1/2 text-[11px] tabular-nums text-muted-foreground">{min}</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          {points.length > 1 ? (
            <>
              <path d={area} fill="var(--primary)" opacity="0.08" />
              <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            </>
          ) : null}
        </svg>
        {points.map((point, index) => {
          const { x, y } = positions[index];
          const last = index === points.length - 1;
          return (
            <span
              key={point.id}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary",
                last ? "h-3.5 w-3.5 ring-4 ring-primary/15" : "h-2.5 w-2.5",
              )}
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          );
        })}
      </div>
      <div aria-hidden="true" className="relative ml-7 mr-2 h-4 text-[11px] text-muted-foreground">
        {points.map((point, index) => {
          const first = index === 0;
          const last = index === points.length - 1;
          if (!showEveryLabel && !first && !last) return null;
          const { x } = positions[index];
          return (
            <span
              key={point.id}
              className={cn(
                "absolute whitespace-nowrap",
                points.length === 1 ? "-translate-x-1/2" : first ? "" : last ? "-translate-x-full" : "-translate-x-1/2",
              )}
              style={{ left: `${x}%` }}
            >
              {shortDate(point.dateISO)}
            </span>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Дата</th>
            <th scope="col">Результат</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.id}>
              <td>{new Date(point.dateISO).toLocaleDateString("ru-RU")}</td>
              <td>
                {point.value} из {max} {unit}
                {point.note ? `, ${point.note}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Маленькая линия тренда для карточек; декоративная, значения есть рядом текстом. */
export function Sparkline({ values, max, min = 0, className }: { values: number[]; max: number; min?: number; className?: string }) {
  if (values.length < 2) return null;
  const positions = values.map((value, index) => pointPosition(index, values.length, value, min, max));
  const path = positions.map((p, index) => `${index === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const last = positions[positions.length - 1];
  return (
    <span aria-hidden="true" className={cn("relative block h-8 w-20", className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" style={{ left: `${last.x}%`, top: `${last.y}%` }} />
    </span>
  );
}
