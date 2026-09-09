import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SituationCard } from "@/components/situation-card";
import { situations } from "@/data/situations";

export const metadata: Metadata = {
  title: "Ситуации и контексты",
  description: "Что часто усиливает тревогу, усталость, одиночество или растерянность: категория ситуации помогает выбрать более точный следующий шаг.",
};

export default function SituationsPage() {
  return (
    <section className="container section detail-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} /> Назад на главную
      </Link>
      <p className="eyebrow">Ситуации</p>
      <h1>Когда состояние усиливается</h1>
      <p className="lead narrow">
        Иногда полезно не только назвать эмоцию, но и понять, в каком контексте она усиливается: перегрузка, конфликт,
        потеря, неопределённость или кризис.
      </p>
      <div className="card-grid">
        {situations.map((item) => (
          <SituationCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
