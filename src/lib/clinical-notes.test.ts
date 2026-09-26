import { afterEach, describe, expect, it } from "bun:test";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  clearDiaryDraft,
  clearVisitPrepDraft,
  loadDiaryDraft,
  loadVisitPrepDraft,
  saveDiaryDraft,
  saveVisitPrepDraft,
  type DiaryDraft,
  type VisitPrepDraft,
} from "./clinical-notes";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function installStorage() {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: storage } });
  return storage;
}

const diaryDraft: DiaryDraft = {
  date: "2026-09-26",
  mood: 6,
  sleepHours: "7.5",
  sleepQuality: 7,
  energy: 5,
  anxiety: 3,
  irritability: 2,
  activity: "walk",
  medication: "as prescribed",
  substances: "",
  stressors: "",
  helpful: "fresh air",
  warningSigns: "",
  notes: "unfinished note",
};

const visitDraft: VisitPrepDraft = {
  visitDate: "2026-10-02",
  priority: "sleep changes",
  changes: "",
  episodes: "",
  sleep: "",
  moodActivity: "",
  currentMedication: "",
  previousMedication: "",
  health: "",
  familyHistory: "",
  substances: "",
  safety: "",
  other: "",
  questions: "",
};

afterEach(() => {
  delete (globalThis as typeof globalThis & { window?: unknown }).window;
});

describe.serial("local clinical form drafts", () => {
  it("restores a diary draft and removes it when discarded", () => {
    installStorage();
    saveDiaryDraft(diaryDraft);

    expect(loadDiaryDraft()).toMatchObject(diaryDraft);
    clearDiaryDraft();
    expect(loadDiaryDraft()).toBeNull();
  });

  it("restores and discards appointment preparation without changing the saved summary", () => {
    const storage = installStorage();
    storage.setItem(STORAGE_KEYS.visitPrep, JSON.stringify({ ...visitDraft, priority: "saved summary", updatedAt: "2026-09-20T10:00:00.000Z" }));
    saveVisitPrepDraft(visitDraft);

    expect(loadVisitPrepDraft()).toMatchObject(visitDraft);
    clearVisitPrepDraft();
    expect(loadVisitPrepDraft()).toBeNull();
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.visitPrep) ?? "{}").priority).toBe("saved summary");
  });

  it("ignores corrupt and out-of-range diary draft data", () => {
    const storage = installStorage();
    storage.setItem(STORAGE_KEYS.diaryDraft, "{broken");
    expect(loadDiaryDraft()).toBeNull();

    storage.setItem(STORAGE_KEYS.diaryDraft, JSON.stringify({ ...diaryDraft, mood: 99 }));
    expect(loadDiaryDraft()).toBeNull();
  });
});
