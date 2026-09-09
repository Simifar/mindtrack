import type { Scale } from "@/data/types";

export function formatMaterialCount(count: number) {
  const remainder = count % 100;
  if (remainder >= 11 && remainder <= 19) return `${count} материалов`;
  if (count % 10 === 1) return `${count} материал`;
  if (count % 10 >= 2 && count % 10 <= 4) return `${count} материала`;
  return `${count} материалов`;
}

export function filterCatalog(items: Scale[], query: string, topicId: string) {
  const normalized = query.trim().toLocaleLowerCase("ru");
  return items.filter((item) => {
    const text = `${item.title} ${item.shortTitle} ${item.summary} ${item.tags.join(" ")}`.toLocaleLowerCase("ru");
    return text.includes(normalized) && (topicId === "all" || item.topicIds.includes(topicId));
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  return { items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize), currentPage, pageCount };
}
