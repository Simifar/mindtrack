import { StorageError } from "./errors";

type StorageListener = (event: StorageEvent) => void;

function getWindow(): Window | null {
  return typeof globalThis.window === "undefined" ? null : globalThis.window;
}

function getStorage(): Storage | null {
  try {
    return getWindow()?.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readRaw(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function readJson<T>(key: string): T | null {
  const raw = readRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) throw new StorageError("Хранилище браузера недоступно", "unavailable");
  try {
    storage.setItem(key, value);
  } catch (error) {
    const isQuota = error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22);
    throw new StorageError(
      isQuota ? "В браузере недостаточно места для сохранения данных" : "Не удалось записать данные в браузер",
      isQuota ? "quota" : "write",
      { cause: error },
    );
  }
}

export function writeJson<T>(key: string, value: T): void {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch (error) {
    throw new StorageError("Не удалось подготовить данные для сохранения", "write", { cause: error });
  }
  if (serialized === undefined) {
    throw new StorageError("Не удалось подготовить данные для сохранения", "write");
  }
  writeRaw(key, serialized);
}

export function removeKey(key: string): void {
  const storage = getStorage();
  if (!storage) throw new StorageError("Хранилище браузера недоступно", "unavailable");
  try {
    storage.removeItem(key);
  } catch (error) {
    throw new StorageError("Не удалось удалить данные из браузера", "write", { cause: error });
  }
}

export function subscribeStorage(listener: StorageListener, keys?: string | readonly string[]): () => void {
  const browserWindow = getWindow();
  if (!browserWindow) return () => undefined;
  const acceptedKeys = keys ? new Set(Array.isArray(keys) ? keys : [keys]) : null;
  const handleStorage = (event: StorageEvent) => {
    if (!acceptedKeys || acceptedKeys.has(event.key)) listener(event);
  };
  browserWindow.addEventListener("storage", handleStorage);
  return () => browserWindow.removeEventListener("storage", handleStorage);
}
