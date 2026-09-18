import { afterEach, describe, expect, it } from "bun:test";
import { loadDraft, saveDraft } from "./progress";

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

afterEach(() => {
  delete (globalThis as typeof globalThis & { window?: unknown }).window;
});

describe.serial("test drafts", () => {
  it("loads a valid draft for a known test", () => {
    installStorage();
    saveDraft({ code: "PHQ9", current: 2, answers: { 0: 1, 1: 0 } });

    expect(loadDraft("PHQ9")).toMatchObject({
      code: "PHQ9",
      current: 2,
      answers: { 0: 1, 1: 0 },
    });
  });

  it("ignores a draft for an unknown test", () => {
    const storage = installStorage();
    storage.setItem(
      "mindtrack:draft:v1:NOPE",
      JSON.stringify({ version: 1, code: "NOPE", current: 0, answers: {}, updatedAt: new Date().toISOString() }),
    );

    expect(loadDraft("NOPE")).toBeNull();
  });

  it("rejects invalid answer values", () => {
    const storage = installStorage();
    storage.setItem(
      "mindtrack:draft:v1:PHQ9",
      JSON.stringify({ version: 1, code: "PHQ9", current: 0, answers: { 0: 99 }, updatedAt: new Date().toISOString() }),
    );

    expect(loadDraft("PHQ9")).toBeNull();
  });

  it("ignores corrupt JSON and starts cleanly", () => {
    const storage = installStorage();
    storage.setItem("mindtrack:draft:v1:PHQ9", "{broken");

    expect(loadDraft("PHQ9")).toBeNull();
  });

  it("rejects stale or structurally invalid draft state", () => {
    const storage = installStorage();
    storage.setItem(
      "mindtrack:draft:v1:PHQ9",
      JSON.stringify({ version: 0, code: "PHQ9", current: 99, answers: { 0: 1 }, updatedAt: "not-a-date" }),
    );

    expect(loadDraft("PHQ9")).toBeNull();
  });
});
