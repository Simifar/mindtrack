"use client";

import { getOptions, getTest } from "@/data/tests";

export interface TestDraft {
  version: 1;
  code: string;
  current: number;
  answers: Record<number, number>;
  updatedAt: string;
}

const KEY_PREFIX = "mindtrack:draft:v1:";

function getStorage(): Storage | null {
  return typeof globalThis.window === "undefined" ? null : globalThis.window.localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDraft(value: unknown, code: string): TestDraft | null {
  const def = getTest(code);
  if (!def || !isRecord(value) || value.version !== 1 || value.code !== code) return null;
  if (
    typeof value.current !== "number" ||
    !Number.isInteger(value.current) ||
    value.current < 0 ||
    value.current >= def.questions.length
  ) return null;
  if (
    typeof value.updatedAt !== "string" ||
    Number.isNaN(Date.parse(value.updatedAt)) ||
    !isRecord(value.answers)
  ) return null;
  const answers: Record<number, number> = {};
  for (const [key, answer] of Object.entries(value.answers)) {
    const questionIndex = Number(key);
    if (
      !/^\d+$/.test(key) ||
      !Number.isInteger(questionIndex) ||
      questionIndex >= def.questions.length ||
      typeof answer !== "number" ||
      !Number.isInteger(answer) ||
      !getOptions(def, questionIndex).some((option) => option.value === answer)
    ) return null;
    answers[questionIndex] = answer;
  }
  return { version: 1, code, current: value.current, answers, updatedAt: value.updatedAt };
}

export function loadDraft(code: string): TestDraft | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(KEY_PREFIX + code);
    return raw ? parseDraft(JSON.parse(raw) as unknown, code) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Omit<TestDraft, "version" | "updatedAt">): void {
  const storage = getStorage();
  if (!storage) return;
  const value: TestDraft = { ...draft, version: 1, updatedAt: new Date().toISOString() };
  try {
    storage.setItem(KEY_PREFIX + draft.code, JSON.stringify(value));
  } catch {
    // Черновик не должен блокировать прохождение: результат всё равно сохраняется отдельно.
  }
}

export function deleteDraft(code: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(KEY_PREFIX + code);
  } catch {
    // Игнорируем недоступное хранилище: это не мешает пользователю пройти тест.
  }
}
