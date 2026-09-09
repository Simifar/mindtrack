import Link from "next/link";
import type { Emotion } from "@/data/types";

export function EmotionCard({ item }: { item: Emotion }) {
  return (
    <article className="scale-card">
      <span className="tag">эмоция</span>
      <h3>
        <Link href={`/emotions/${item.slug}`}>{item.title}</Link>
      </h3>
      <p className="card-title">{item.shortDescription}</p>
      <p>{item.signs[0]}</p>
      <div className="card-meta">
        <span>{item.reviewStatus === "assessed" ? "Проверено" : "Скоро дополним"}</span>
        <Link className="text-link" href={`/emotions/${item.slug}`}>
          Подробнее →
        </Link>
      </div>
    </article>
  );
}
