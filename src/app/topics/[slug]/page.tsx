import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { topics } from "@/data/topics";
import { screeningScales } from "@/data/scales";

export const dynamicParams = false;
export function generateStaticParams() { return topics.map((topic) => ({ slug: topic.slug })); }
export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { return params.then(({ slug }) => { const topic = topics.find((item) => item.slug === slug); return { title: topic?.title ?? "Раздел", description: topic?.description }; }); }

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const topic = topics.find((item) => item.slug === slug); if (!topic) notFound();
  const items = screeningScales.filter((item) => item.topicIds.includes(topic.id));
  return <section className="container section"><Link className="back-link" href="/topics">← Все разделы</Link><p className="eyebrow">{topic.title}</p><h1>{topic.title}</h1><p className="lead narrow">{topic.description}</p><div className="card-grid">{items.map((item) => <article className="scale-card" key={item.id}><span className="tag">{item.tags[0]}</span><h2><Link href={`/scales/${item.slug}`}>{item.title}</Link></h2><p className="card-title">{item.shortTitle}</p><p>{item.summary}</p><Link className="text-link" href={`/scales/${item.slug}`}>Подробнее →</Link></article>)}</div></section>;
}
