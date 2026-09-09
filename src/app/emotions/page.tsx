import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EmotionCard } from "@/components/emotion-card";
import { emotions } from "@/data/emotions";

export const metadata: Metadata = {
  title: "Эмоции простыми словами",
  description: "Словарь эмоциональных состояний: как они обычно ощущаются, чего человек может хотеть и к чему лучше присмотреться.",
};

export default function EmotionsPage() {
  return (
    <section className="container section detail-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} /> Назад на главную
      </Link>
      <p className="eyebrow">Эмоции простыми словами</p>
      <h1>Что может ощущаться внутри</h1>
      <p className="lead narrow">
        Этот словарь не заменяет диагноз и не ставит ярлыки за человека. Он помогает назвать состояние простыми словами,
        увидеть похожие реакции и понять, что может быть полезно сейчас.
      </p>
      <div className="card-grid">
        {emotions.map((emotion) => (
          <EmotionCard key={emotion.id} item={emotion} />
        ))}
      </div>
    </section>
  );
}
