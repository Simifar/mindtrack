"use client";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";

export function FavoriteButton({ id }: { id: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(id);
  return <button className="button button-secondary" onClick={() => toggleFavorite(id)} aria-pressed={active}><Star size={18} fill={active ? "currentColor" : "none"} /> {active ? "В избранном" : "В избранное"}</button>;
}
