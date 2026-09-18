"use client";

import { getTest, maxScore, scoreTest, type ScoreResult } from "@/data/tests";
import { validateAnswers } from "@/domain/tests/validation";
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
const MAX_IMPORT_LENGTH = 1_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseResult(value: unknown): SavedResult | null {
  if (!isRecord(value)) return null;
  if (!value.id || typeof value.id !== "string" || typeof value.code !== "string" || typeof value.testName !== "string") return null;
  if (typeof value.dateISO !== "string" || Number.isNaN(Date.parse(value.dateISO))) return null;
  if (typeof value.totalScore !== "number" || !Number.isFinite(value.totalScore) || typeof value.maxScore !== "number" || !Number.isFinite(value.maxScore)) return null;
  if (typeof value.severity !== "string" || typeof value.label !== "string" || typeof value.advice !== "string") return null;
  if (typeof value.crisisDetected !== "boolean" || !isRecord(value.answers)) return null;
  const def = getTest(value.code);
  if (!def) return null;
  const validation = validateAnswers(def, value.answers);
  if (!validation.valid) return null;

  // Пересчитываем сохранённые результаты текущим алгоритмом. Это мигрирует старые
  // записи после исправлений скоринга, не меняя сами ответы пользователя.
  const score = scoreTest(def, validation.answers);
  return {
    ...value,
    testName: def.name,
    totalScore: score.totalScore,
    maxScore: maxScore(def),
    severity: score.severity,
    label: score.label,
    advice: score.advice,
    crisisDetected: score.crisisDetected,
    answers: validation.answers,
  } as SavedResult;
}

function readAll(): SavedResult[] {
  const value = readJsonWithLegacy<unknown[]>(STORAGE_KEYS.results, STORAGE_KEYS.resultsLegacy);
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.map(parseResult).filter((item): item is SavedResult => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function loadResults(): SavedResult[] {
  return readAll().sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
}

export function loadResultsByCode(code: string): SavedResult[] {
  return loadResults().filter((r) => r.code === code);
}

export function saveResult(entry: Omit<SavedResult, "id">): SavedResult {
  const candidate = {
    ...entry,
    id: `${entry.code}-${entry.dateISO}-${Math.random().toString(36).slice(2, 8)}`,
  };
  const item = parseResult(candidate);
  if (!item) throw new Error("Не удалось проверить результат перед сохранением");
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
  if (raw.length > MAX_IMPORT_LENGTH) throw new Error("Файл JSON слишком большой");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Файл не является корректным JSON");
  }

  const candidates = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.results) ? parsed.results : null;
  if (!candidates) throw new Error("В JSON не найден список результатов");

  const existing = readAll();
  const byId = new Map(existing.map((item) => [item.id, item]));
  const seenIds = new Set(byId.keys());
  const imported: SavedResult[] = [];
  let skipped = 0;
  for (const candidate of candidates) {
    const item = parseResult(candidate);
    if (!item || seenIds.has(item.id)) {
      skipped += 1;
      continue;
    }
    seenIds.add(item.id);
    imported.push(item);
    byId.set(item.id, item);
  }
  const next = [...byId.values()].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)).slice(0, MAX_ITEMS);

  try {
    writeJson(STORAGE_KEYS.results, next);
  } catch (error) {
    throw new Error("Не удалось импортировать результаты в браузер", { cause: error });
  }
  return { imported: imported.length, skipped };
}

export type ResultCompleteness = "complete" | "incomplete";

export function getResultCompleteness(result: SavedResult): ResultCompleteness {
  const def = getTest(result.code);
  return def && validateAnswers(def, result.answers, { requireComplete: true }).valid ? "complete" : "incomplete";
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
