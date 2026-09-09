import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { topics } from "@/data/topics";
import { screeningScales } from "@/data/scales";
import { formatMaterialCount } from "@/lib/catalog";

export const metadata: Metadata = { title: "Разделы", description: "Разделы справочника MindTrack." };

export default function TopicsPage() {
  return <section className="container section"><p className="eyebrow">Навигация</p><h1>Разделы справочника</h1><p className="lead narrow">Выберите тему, чтобы увидеть связанные материалы.</p><div className="topic-grid">{topics.map((topic) => { const count = screeningScales.filter((item) => item.topicIds.includes(topic.id)).length; return <Link className="topic-card" href={`/topics/${topic.slug}`} key={topic.id}><span className="tag">{formatMaterialCount(count)}</span><h2>{topic.title}</h2><p>{topic.description}</p><span className="text-link">Открыть <ArrowRight size={16} /></span></Link>; })}</div></section>;
}
