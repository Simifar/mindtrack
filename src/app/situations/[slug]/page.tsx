import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { emotions } from "@/data/emotions";
import { situations } from "@/data/situations";
import { tools } from "@/data/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return situations.map((item) => ({ slug: item.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const item = situations.find((situation) => situation.slug === slug);
    return { title: item?.title ?? "Ситуация", description: item?.description };
  });
}

export default async function SituationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = situations.find((situation) => situation.slug === slug);

  if (!item) {
    notFound();
  }

  const associatedEmotions = emotions.filter((emotion) => item.emotionIds.includes(emotion.id));
  const associatedTools = tools.filter((tool) => item.toolIds.includes(tool.id));

  return (
    <article className="container section detail-page">
      <Link className="back-link" href="/situations">
        <ArrowLeft size={16} /> Все ситуации
      </Link>

      <div className="detail-header">
        <div>
          <span className="tag">ситуация</span>
          <h1>{item.title}</h1>
        </div>
      </div>

      <p className="lead narrow">{item.description}</p>

      <div className="detail-layout">
        <div>
          <section className="prose-block">
            <h2>Что это может значить</h2>
            <p>
              В такой ситуации часто усиливаются конкретные эмоциональные состояния, а внимание смещается на защиту,
              восстановление, ясность или поддержку.
            </p>
          </section>

          <section className="prose-block">
            <h2>Следующие шаги</h2>
            <ul>
              {item.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="related-box">
          <h2>Связанные эмоции</h2>
          <ul>
            {associatedEmotions.map((emotion) => (
              <li key={emotion.id}>
                <Link href={`/emotions/${emotion.slug}`}>{emotion.title}</Link>
              </li>
            ))}
          </ul>

          <h2>Полезные инструменты</h2>
          <ul>
            {associatedTools.map((tool) => (
              <li key={tool.id}>
                <Link href={`/tools/${tool.slug}`}>{tool.title}</Link>
              </li>
            ))}
          </ul>

          <div className="notice">
            <ShieldAlert size={18} aria-hidden="true" />
            <div>
              <strong>{item.helpLevel === "urgent-help" ? "Нужна срочная помощь" : item.helpLevel === "consider-help" ? "Полезно обсудить со специалистом" : "Самопомощь и наблюдение"}</strong>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
