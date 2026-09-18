import { afterEach, describe, expect, it } from "bun:test";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { getResultCompleteness, importResultsJson, loadResults } from "./results";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function installStorage() {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
  return storage;
}

function result(id: string, answers: Record<number, number> = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [index, 0]))) {
  return {
    id,
    code: "PHQ9",
    testName: "PHQ-9 — шкала депрессии",
    dateISO: "2026-09-18T10:00:00.000Z",
    totalScore: 0,
    maxScore: 27,
    severity: "none",
    label: "Минимум / нет симптоматики",
    advice: "Продолжайте наблюдение в обычном режиме.",
    crisisDetected: false,
    answers,
  };
}

afterEach(() => {
  delete (globalThis as typeof globalThis & { window?: unknown }).window;
});

describe.serial("results import validation", () => {
  it("imports valid results and preserves complete status", () => {
    installStorage();
    const outcome = importResultsJson(JSON.stringify({ version: 2, results: [result("valid-1")] }));

    expect(outcome).toEqual({ imported: 1, skipped: 0 });
    expect(getResultCompleteness(loadResults()[0])).toBe("complete");
  });

  it("imports valid partial results as incomplete", () => {
    installStorage();
    const outcome = importResultsJson(JSON.stringify({ results: [result("partial-1", { 0: 2 })] }));
    const imported = loadResults()[0];

    expect(outcome).toEqual({ imported: 1, skipped: 0 });
    expect(getResultCompleteness(imported)).toBe("incomplete");
    expect(imported.totalScore).toBe(2);
  });

  it("skips unknown tests and invalid answer values", () => {
    installStorage();
    const unknown = { ...result("unknown-1"), code: "NOPE" };
    const invalid = result("invalid-1", { 0: 99 });

    expect(importResultsJson(JSON.stringify({ results: [unknown, invalid] }))).toEqual({ imported: 0, skipped: 2 });
    expect(loadResults()).toEqual([]);
  });

  it("skips duplicate IDs", () => {
    installStorage();
    const item = result("duplicate-1");

    expect(importResultsJson(JSON.stringify({ results: [item, item] }))).toEqual({ imported: 1, skipped: 1 });
    expect(importResultsJson(JSON.stringify({ results: [item] }))).toEqual({ imported: 0, skipped: 1 });
  });

  it("rejects malformed and oversized input", () => {
    installStorage();
    expect(() => importResultsJson("{broken")).toThrow("корректным JSON");
    expect(() => importResultsJson("x".repeat(1_000_001))).toThrow("слишком большой");
  });

  it("migrates the legacy results key through the adapter", () => {
    const storage = installStorage();
    storage.setItem(STORAGE_KEYS.resultsLegacy, JSON.stringify([result("legacy-1")]));

    expect(loadResults()).toHaveLength(1);
    expect(storage.getItem(STORAGE_KEYS.results)).not.toBeNull();
  });
});
