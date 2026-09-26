import { afterEach, describe, expect, it } from "bun:test";
import { STORAGE_KEYS, draftKey } from "@/lib/storage/keys";
import { clearMindTrackData } from "./local-data";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

afterEach(() => {
  delete (globalThis as typeof globalThis & { window?: unknown }).window;
});

describe.serial("clear MindTrack browser data", () => {
  it("removes MindTrack records and drafts without clearing other site data", () => {
    const localStorage = new MemoryStorage();
    localStorage.setItem(STORAGE_KEYS.results, "results");
    localStorage.setItem(STORAGE_KEYS.diaryDraft, "diary draft");
    localStorage.setItem(draftKey("PHQ9"), "test draft");
    localStorage.setItem("another-app:data", "keep");
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage } });

    expect(clearMindTrackData()).toEqual({ failed: 0 });
    expect(localStorage.getItem(STORAGE_KEYS.results)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.diaryDraft)).toBeNull();
    expect(localStorage.getItem(draftKey("PHQ9"))).toBeNull();
    expect(localStorage.getItem("another-app:data")).toBe("keep");
  });
});
