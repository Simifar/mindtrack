"use client";

export interface TestDraft {
  version: 1;
  code: string;
  current: number;
  answers: Record<number, number>;
  updatedAt: string;
}

const KEY_PREFIX = "mindtrack:draft:v1:";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDraft(value: unknown, code: string): TestDraft | null {
  if (!isRecord(value) || value.version !== 1 || value.code !== code) return null;
  if (typeof value.current !== "number" || !Number.isInteger(value.current) || value.current < 0) return null;
  if (typeof value.updatedAt !== "string" || !isRecord(value.answers)) return null;
  const answers: Record<number, number> = {};
  for (const [key, answer] of Object.entries(value.answers)) {
    if (!/^\d+$/.test(key) || typeof answer !== "number" || !Number.isFinite(answer)) return null;
    answers[Number(key)] = answer;
  }
  return { version: 1, code, current: value.current, answers, updatedAt: value.updatedAt };
}

export function loadDraft(code: string): TestDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_PREFIX + code);
    return raw ? parseDraft(JSON.parse(raw) as unknown, code) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Omit<TestDraft, "version" | "updatedAt">): void {
  if (typeof window === "undefined") return;
  const value: TestDraft = { ...draft, version: 1, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY_PREFIX + draft.code, JSON.stringify(value));
  } catch {
    // Черновик не должен блокировать прохождение: результат всё равно сохраняется отдельно.
  }
}

export function deleteDraft(code: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY_PREFIX + code);
  } catch {
    // Игнорируем недоступное хранилище: это не мешает пользователю пройти тест.
  }
}
