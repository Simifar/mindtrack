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

const KEY = "mindtrack:results:v1";
const MAX_ITEMS = 200;

function readAll(): SavedResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedResult[];
    return Array.isArray(arr) ? arr : [];
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
  } catch {
    /* ignore quota errors */
  }
  return item;
}

export function deleteResult(id: string): void {
  const next = readAll().filter((r) => r.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearResults(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
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
