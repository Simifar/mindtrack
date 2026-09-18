"use client";

import { getTest, maxScore, scoreTest, type ScoreResult } from "@/data/tests";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { readJsonWithLegacy } from "@/lib/storage/migrations";
import { removeKey, writeJson } from "@/lib/storage/storage";

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
  const def = getTest(value.code);
  if (!def) return { ...value, answers } as SavedResult;

  // Пересчитываем сохранённые результаты текущим алгоритмом. Это мигрирует старые
  // записи после исправлений скоринга, не меняя сами ответы пользователя.
  const score = scoreTest(def, answers);
  return {
    ...value,
    testName: def.name,
    totalScore: score.totalScore,
    maxScore: maxScore(def),
    severity: score.severity,
    label: score.label,
    advice: score.advice,
    crisisDetected: score.crisisDetected,
    answers,
  } as SavedResult;
}

function readAll(): SavedResult[] {
  const value = readJsonWithLegacy<unknown[]>(STORAGE_KEYS.results, STORAGE_KEYS.resultsLegacy);
  if (!Array.isArray(value)) return [];
  return value.map(parseResult).filter((item): item is SavedResult => item !== null);
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
    writeJson(STORAGE_KEYS.results, next);
  } catch (error) {
    throw new Error("Не удалось сохранить результат в браузере", { cause: error });
  }
  return item;
}

export function deleteResult(id: string): void {
  const next = readAll().filter((r) => r.id !== id);
  try {
    writeJson(STORAGE_KEYS.results, next);
  } catch {
    throw new Error("Не удалось удалить результат из браузера");
  }
}

export function clearResults(): void {
  try {
    removeKey(STORAGE_KEYS.results);
    removeKey(STORAGE_KEYS.resultsLegacy);
  } catch {
    throw new Error("Не удалось очистить историю результатов");
  }
}

export function exportResultsJson(): string {
  return JSON.stringify(
    { source: "MindTrack", version: 2, exportedAt: new Date().toISOString(), results: loadResults() },
    null,
    2,
  );
}

export function importResultsJson(raw: string): { imported: number; skipped: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Файл не является корректным JSON");
  }

  const candidates = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.results) ? parsed.results : null;
  if (!candidates) throw new Error("В JSON не найден список результатов");

  const imported = candidates.map(parseResult).filter((item): item is SavedResult => item !== null);
  const existing = readAll();
  const byId = new Map(existing.map((item) => [item.id, item]));
  for (const item of imported) byId.set(item.id, item);
  const next = [...byId.values()].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)).slice(0, MAX_ITEMS);

  try {
    writeJson(STORAGE_KEYS.results, next);
  } catch (error) {
    throw new Error("Не удалось импортировать результаты в браузер", { cause: error });
  }
  return { imported: imported.length, skipped: candidates.length - imported.length };
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
    case "context":
      return "var(--chart-4)";
    case "severe":
      return "var(--destructive)";
    default:
      return "var(--muted-foreground)";
  }
}

export type { ScoreResult };
