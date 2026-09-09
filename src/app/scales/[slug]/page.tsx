import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { screeningScales } from "@/data/scales";
import { topics } from "@/data/topics";
import { FavoriteButton } from "@/components/favorite-button";

export const dynamicParams = false;
export function generateStaticParams() { return screeningScales.map((scale) => ({ slug: scale.slug })); }
export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { return params.then(({ slug }) => { const item = screeningScales.find((scale) => scale.slug === slug); return { title: item?.title ?? "Материал", description: item?.summary, robots: item ? undefined : { index: false } }; }); }

export default async function ScalePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const item = screeningScales.find((scale) => scale.slug === slug); if (!item) notFound();
  const relatedTopics = topics.filter((topic) => item.topicIds.includes(topic.id));
  return <article className="container section detail-page"><Link className="back-link" href="/">← В каталог</Link><div className="detail-header"><div><span className="tag">{item.tags[0]}</span><h1>{item.title}</h1><p className="detail-subtitle">{item.shortTitle}</p></div><FavoriteButton id={item.id} /></div><p className="lead narrow">{item.summary}</p><div className="detail-layout"><div><section className="prose-block"><h2>О материале</h2><p>{item.description}</p><p><strong>Для кого:</strong> {item.audience}</p><p><strong>Время:</strong> около {item.durationMinutes} минут</p></section><section className="notice"><strong>Важно</strong><p>Результат скрининга не является диагнозом. Если состояние беспокоит вас или мешает повседневной жизни, обратитесь к квалифицированному специалисту.</p></section></div><aside className="related-box"><h2>Связанные разделы</h2>{relatedTopics.map((topic) => <Link key={topic.id} href={`/topics/${topic.slug}`}>{topic.title}</Link>)}<div className="status-line"><Star size={16} /> {item.reviewStatus === "assessed" ? "Материал проверен редактором" : "Материал ожидает редакционной проверки"}</div></aside></div></article>;
}
