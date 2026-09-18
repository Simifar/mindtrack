import { readJson, writeJson } from "./storage";

/**
 * Reads the current key first and lazily copies a valid legacy value forward.
 * The legacy key is intentionally retained so a failed migration cannot lose data.
 */
export function readJsonWithLegacy<T>(currentKey: string, legacyKey: string): T | null {
  const current = readJson<T>(currentKey);
  if (current !== null) return current;

  const legacy = readJson<T>(legacyKey);
  if (legacy !== null) {
    try {
      writeJson(currentKey, legacy);
    } catch {
      // The legacy value remains available if the browser cannot write the new key.
    }
  }
  return legacy;
}
