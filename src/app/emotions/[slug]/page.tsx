import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { emotions } from "@/data/emotions";

export const dynamicParams = false;

export function generateStaticParams() {
  return emotions.map((emotion) => ({ slug: emotion.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const emotion = emotions.find((item) => item.slug === slug);
    return { title: emotion?.title ?? "Эмоция", description: emotion?.shortDescription };
  });
}

export default async function EmotionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const emotion = emotions.find((item) => item.slug === slug);

  if (!emotion) {
    notFound();
  }

  return (
    <article className="container section detail-page">
      <Link className="back-link" href="/emotions">
        <ArrowLeft size={16} /> Все эмоции
      </Link>

      <div className="detail-header">
        <div>
          <span className="tag">эмоция</span>
          <h1>{emotion.title}</h1>
        </div>
      </div>

      <p className="lead narrow">{emotion.shortDescription}</p>

      <div className="detail-layout">
        <div>
          <section className="prose-block">
            <h2>Как это обычно ощущается</h2>
            <ul>
              {emotion.signs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="prose-block">
            <h2>Что может происходить в теле</h2>
            <ul>
              {emotion.bodySignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="prose-block">
            <h2>Какие мысли могут появляться</h2>
            <ul>
              {emotion.commonThoughts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="related-box">
          <h2>Что может быть нужно</h2>
          <ul>
            {emotion.possibleNeeds.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2>Похоже на</h2>
          <ul>
            {emotion.similarStates.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="notice">
            <Sparkles size={18} aria-hidden="true" />
            <div>
              <strong>Что можно попробовать</strong>
              <ul>
                {emotion.tryNow.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
