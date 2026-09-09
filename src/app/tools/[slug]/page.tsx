import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { tools } from "@/data/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const tool = tools.find((item) => item.slug === slug);
    return { title: tool?.title ?? "Инструмент", description: tool?.purpose };
  });
}

export default async function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    notFound();
  }

  return (
    <article className="container section detail-page">
      <Link className="back-link" href="/tools">
        <ArrowLeft size={16} /> Все инструменты
      </Link>

      <div className="detail-header">
        <div>
          <span className="tag">инструмент</span>
          <h1>{tool.title}</h1>
        </div>
      </div>

      <p className="lead narrow">{tool.purpose}</p>

      <div className="detail-layout">
        <div>
          <section className="prose-block">
            <h2>Как сделать</h2>
            <ol>
              {tool.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="related-box">
          <h2>Подходит для</h2>
          <ul>
            {tool.suitableFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="notice">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>Важно</strong>
              <ul>
                {tool.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
