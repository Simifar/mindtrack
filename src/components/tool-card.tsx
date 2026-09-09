import Link from "next/link";
import type { Tool } from "@/data/types";

export function ToolCard({ item }: { item: Tool }) {
  return (
    <article className="scale-card">
      <span className="tag">инструмент</span>
      <h3>
        <Link href={`/tools/${item.slug}`}>{item.title}</Link>
      </h3>
      <p className="card-title">{item.purpose}</p>
      <div className="card-meta">
        <span>{item.durationMinutes} мин</span>
        <Link className="text-link" href={`/tools/${item.slug}`}>
          Подробнее →
        </Link>
      </div>
    </article>
  );
}
