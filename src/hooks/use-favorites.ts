"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mindtrack:favorites";
function readFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => typeof window === "undefined" ? [] : readFavorites());
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) setFavorites(readFavorites()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* local-only enhancement */ }
      return next;
    });
  }, []);
  return { favorites, isFavorite: (id: string) => favorites.includes(id), toggleFavorite };
}
