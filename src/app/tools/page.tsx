import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "Что можно сделать сейчас",
  description: "Практические инструменты: успокоиться, понять состояние, начать действовать и восстановиться.",
};

export default function ToolsPage() {
  return (
    <section className="container section detail-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} /> Назад на главную
      </Link>
      <p className="eyebrow">Практика</p>
      <h1>Что можно сделать сейчас</h1>
      <p className="lead narrow">
        Материалы здесь не обещают мгновенного решения, но помогают выбрать один понятный и безопасный шаг в зависимости
        от вашей цели: успокоиться, понять, начать действовать или восстановиться.
      </p>
      <div className="card-grid">
        {tools.map((item) => (
          <ToolCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
