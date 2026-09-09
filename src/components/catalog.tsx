"use client";

import Link from "next/link";
import { Search, Star, X } from "lucide-react";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Scale, Topic } from "@/data/types";
import { useFavorites } from "@/hooks/use-favorites";
import { filterCatalog, formatMaterialCount, paginate } from "@/lib/catalog";

export function Catalog({ items, topics }: { items: Scale[]; topics: Topic[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const topic = params.get("topic") ?? "all";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const { isFavorite, toggleFavorite } = useFavorites();
  const filtered = useMemo(() => filterCatalog(items, query, topic), [items, query, topic]);
  const pageSize = 6;
  const { items: visible, currentPage, pageCount } = paginate(filtered, page, pageSize);
  function updateParams(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value); else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}#catalog`, { scroll: false });
  }
  function pageHref(nextPage: number) {
    const next = new URLSearchParams(params.toString()); next.set("page", String(nextPage)); return `${pathname}?${next.toString()}#catalog`;
  }

  return (
    <div>
      <div className="filters" role="search">
        <label className="search-field"><Search size={18} aria-hidden="true" /><span className="sr-only">Поиск по каталогу</span><input value={query} onChange={(event) => updateParams("q", event.target.value)} placeholder="Поиск по каталогу" /><button className="clear-search" type="button" onClick={() => updateParams("q", "")} aria-label="Очистить поиск" hidden={!query}><X size={17} /></button></label>
        <label className="topic-filter"><span className="sr-only">Раздел</span><select value={topic} onChange={(event) => updateParams("topic", event.target.value)}><option value="all">Все разделы</option>{topics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      </div>
      <p className="muted result-line" aria-live="polite">Найдено: {formatMaterialCount(filtered.length)}</p>
      <div className="card-grid">{visible.map((item) => <article className="scale-card" key={item.id}>
        <div className="card-top"><span className="tag">{item.tags[0]}</span><button className="icon-button" onClick={() => toggleFavorite(item.id)} aria-label={isFavorite(item.id) ? `Убрать ${item.title} из избранного` : `Добавить ${item.title} в избранное`}><Star size={18} fill={isFavorite(item.id) ? "currentColor" : "none"} /></button></div>
        <h3><Link href={`/scales/${item.slug}`}>{item.title}</Link></h3><p className="card-title">{item.shortTitle}</p><p>{item.summary}</p>
        <div className="card-meta"><span>{item.durationMinutes} мин</span><Link className="text-link" href={`/scales/${item.slug}`}>О тесте →</Link></div>
      </article>)}</div>
      {pageCount > 1 && <nav className="pagination" aria-label="Страницы каталога">{Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => <Link aria-current={item === currentPage ? "page" : undefined} className={item === currentPage ? "current" : ""} href={pageHref(item)} key={item}>{item}</Link>)}</nav>}
      {filtered.length === 0 && <div className="empty-state">Ничего не найдено. Попробуйте изменить запрос или раздел.</div>}
    </div>
  );
}
