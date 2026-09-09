import Link from "next/link";
import type { Situation } from "@/data/types";

export function SituationCard({ item }: { item: Situation }) {
  return (
    <article className="scale-card">
      <span className="tag">ситуация</span>
      <h3>
        <Link href={`/situations/${item.slug}`}>{item.title}</Link>
      </h3>
      <p className="card-title">{item.description}</p>
      <div className="card-meta">
        <span>{item.helpLevel === "urgent-help" ? "Срочная помощь" : item.helpLevel === "consider-help" ? "Важно обсудить" : "Самопомощь"}</span>
        <Link className="text-link" href={`/situations/${item.slug}`}>
          Подробнее →
        </Link>
      </div>
    </article>
  );
}
