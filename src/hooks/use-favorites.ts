"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "mindtrack:favorites";
const EMPTY_FAVORITES: string[] = [];
let cachedRaw: string | null | undefined;
let cachedFavorites = EMPTY_FAVORITES;
function readFavorites(): string[] {
  if (typeof window === "undefined") return EMPTY_FAVORITES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedFavorites;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedRaw = raw;
    cachedFavorites = Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : EMPTY_FAVORITES;
    return cachedFavorites;
  } catch {
    return EMPTY_FAVORITES;
  }
}

export function useFavorites() {
  const favorites = useSyncExternalStore(
    (onChange) => {
      const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) onChange(); };
      window.addEventListener("storage", onStorage);
      window.addEventListener("mindtrack:favorites-change", onChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("mindtrack:favorites-change", onChange);
      };
    },
    readFavorites,
    () => [],
  );
  const toggleFavorite = useCallback((id: string) => {
    const current = readFavorites();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("mindtrack:favorites-change"));
    } catch {
      // Favorites are an optional local-only enhancement.
    }
  }, []);
  return { favorites, isFavorite: (id: string) => favorites.includes(id), toggleFavorite };
}
