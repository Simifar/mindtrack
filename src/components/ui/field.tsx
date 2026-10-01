"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Единый вид полей ввода. Раньше класс дублировался в дневнике и подготовке
 * к приёму, из-за чего кольцо фокуса и радиус расходились с кнопками.
 */
export const fieldClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-[3px]";

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {hint ? <span className="block text-xs leading-relaxed text-muted-foreground">{hint}</span> : null}
      <textarea
        className={cn(fieldClass, "resize-y leading-relaxed")}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

/**
 * Шкала 0–10. Пока значения не касались, она не притворяется ответом:
 * вместо «5/10» показывается «не задано», а концы шкалы подписаны словами.
 */
export function RangeField({
  label,
  value,
  onChange,
  hint,
  touched = true,
  max = 10,
  startLabel,
  endLabel,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  touched?: boolean;
  max?: number;
  startLabel?: string;
  endLabel?: string;
}) {
  const id = React.useId();
  const hintId = `${id}-hint`;

  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <span
          className={cn(
            "rounded-lg bg-muted px-2 py-0.5 text-xs tabular-nums",
            !touched && "range-value-empty",
          )}
        >
          {touched ? `${value}/${max}` : "не задано"}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max={max}
        step="1"
        value={value}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      {(startLabel || endLabel) && (
        <div className="flex justify-between gap-2 text-[11px] leading-tight text-muted-foreground">
          <span>{startLabel}</span>
          <span className="text-right">{endLabel}</span>
        </div>
      )}
      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
