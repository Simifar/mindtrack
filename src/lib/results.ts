"use client";

import type { ScoreResult } from "@/data/tests";

export interface SavedResult {
  id: string;
  code: string;
  testName: string;
  dateISO: string;
  totalScore: number;
  maxScore: number;
  severity: string;
  label: string;
  advice: string;
  crisisDetected: boolean;
  answers: Record<number, number>;
}

const KEY = "mindtrack:results:v2";
const LEGACY_KEY = "mindtrack:results:v1";
const MAX_ITEMS = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseResult(value: unknown): SavedResult | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.code !== "string" || typeof value.testName !== "string") return null;
  if (typeof value.dateISO !== "string" || Number.isNaN(Date.parse(value.dateISO))) return null;
  if (typeof value.totalScore !== "number" || typeof value.maxScore !== "number") return null;
  if (typeof value.severity !== "string" || typeof value.label !== "string" || typeof value.advice !== "string") return null;
  if (typeof value.crisisDetected !== "boolean" || !isRecord(value.answers)) return null;
  const answers: Record<number, number> = {};
  for (const [key, answer] of Object.entries(value.answers)) {
    if (!/^\d+$/.test(key) || typeof answer !== "number" || !Number.isFinite(answer)) return null;
    answers[Number(key)] = answer;
  }
  return { ...value, answers } as SavedResult;
}

function readAll(): SavedResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map(parseResult).filter((item): item is SavedResult => item !== null);
  } catch {
    return [];
  }
}

export function loadResults(): SavedResult[] {
  return readAll().sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
}

export function loadResultsByCode(code: string): SavedResult[] {
  return loadResults().filter((r) => r.code === code);
}

export function saveResult(entry: Omit<SavedResult, "id">): SavedResult {
  const item: SavedResult = {
    ...entry,
    id: `${entry.code}-${entry.dateISO}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const next = [item, ...readAll()].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    throw new Error("Не удалось сохранить результат в браузере", { cause: error });
  }
  return item;
}

export function deleteResult(id: string): void {
  const next = readAll().filter((r) => r.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new Error("Не удалось удалить результат из браузера");
  }
}

export function clearResults(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    throw new Error("Не удалось очистить историю результатов");
  }
}

/** Цвет бейджа по severity — через CSS-переменные темы. */
export function severityColor(severity: string): string {
  switch (severity) {
    case "none":
    case "negative":
      return "var(--chart-2)";
    case "mild":
      return "var(--chart-4)";
    case "moderate":
      return "var(--chart-5)";
    case "moderately_severe":
    case "positive":
      return "var(--chart-1)";
    case "severe":
      return "var(--destructive)";
    default:
      return "var(--muted-foreground)";
  }
}

export type { ScoreResult };
