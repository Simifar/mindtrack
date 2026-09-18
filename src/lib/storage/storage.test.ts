import { afterEach, describe, expect, it } from "bun:test";
import { StorageError } from "./errors";
import { readJsonWithLegacy } from "./migrations";
import { readJson, removeKey, subscribeStorage, writeJson } from "./storage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  failure: "quota" | "write" | null = null;

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
    if (this.failure === "quota") throw new DOMException("quota", "QuotaExceededError");
    if (this.failure === "write") throw new Error("write failed");
    this.values.set(key, value);
  }
}

function installStorage(storage = new MemoryStorage()) {
  const listeners = new Set<(event: StorageEvent) => void>();
  const browserWindow = {
    localStorage: storage,
    addEventListener: (_type: string, listener: (event: StorageEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: StorageEvent) => void) => listeners.delete(listener),
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browserWindow });
  return {
    storage,
    dispatch(event: StorageEvent) {
      listeners.forEach((listener) => listener(event));
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => {
  delete (globalThis as typeof globalThis & { window?: unknown }).window;
});

describe.serial("storage adapter", () => {
  it("reads, writes and removes JSON values", () => {
    installStorage();
    writeJson("mindtrack:test", { value: 42 });

    expect(readJson<{ value: number }>("mindtrack:test")).toEqual({ value: 42 });
    removeKey("mindtrack:test");
    expect(readJson("mindtrack:test")).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    const { storage } = installStorage();
    storage.setItem("mindtrack:test", "{broken");

    expect(readJson("mindtrack:test")).toBeNull();
  });

  it("reports unavailable and quota errors", () => {
    expect(() => writeJson("mindtrack:test", { value: 1 })).toThrow(StorageError);

    const { storage } = installStorage();
    storage.failure = "quota";
    try {
      writeJson("mindtrack:test", { value: 1 });
      throw new Error("expected quota error");
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError);
      expect((error as StorageError).code).toBe("quota");
    }
  });

  it("migrates a legacy JSON value without deleting its source", () => {
    const { storage } = installStorage();
    storage.setItem("mindtrack:legacy", JSON.stringify({ value: 7 }));

    expect(readJsonWithLegacy<{ value: number }>("mindtrack:current", "mindtrack:legacy")).toEqual({ value: 7 });
    expect(storage.getItem("mindtrack:current")).toBe(JSON.stringify({ value: 7 }));
    expect(storage.getItem("mindtrack:legacy")).toBe(JSON.stringify({ value: 7 }));
  });

  it("subscribes only to selected storage keys and can unsubscribe", () => {
    const environment = installStorage();
    const keys: Array<string | null> = [];
    const unsubscribe = subscribeStorage((event) => keys.push(event.key), ["allowed"]);
    expect(environment.listenerCount()).toBe(1);

    environment.dispatch({ key: "ignored" } as StorageEvent);
    environment.dispatch({ key: "allowed" } as StorageEvent);
    unsubscribe();
    environment.dispatch({ key: "allowed" } as StorageEvent);

    expect(keys).toEqual(["allowed"]);
    expect(environment.listenerCount()).toBe(0);
  });
});
