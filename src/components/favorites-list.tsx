"use client";
import Link from "next/link";
import { screeningScales } from "@/data/scales";
import { useFavorites } from "@/hooks/use-favorites";

export function FavoritesList() {
  const { favorites } = useFavorites();
  const items = screeningScales.filter((item) => favorites.includes(item.id));
  if (!items.length) return <div className="empty-state">В избранном пока нет материалов. <Link className="text-link" href="/">Перейти в каталог</Link></div>;
  return <div className="card-grid">{items.map((item) => <article className="scale-card" key={item.id}><span className="tag">{item.tags[0]}</span><h2><Link href={`/scales/${item.slug}`}>{item.title}</Link></h2><p>{item.summary}</p><Link className="text-link" href={`/scales/${item.slug}`}>Открыть →</Link></article>)}</div>;
}
