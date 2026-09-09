import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Как пользоваться справочником",
  description: "Навигация по материалам MindTrack без самотестов и автоматических выводов.",
};

export default function CheckInPage() {
  return (
    <section className="container section detail-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} /> Назад на главную
      </Link>
      <p className="eyebrow">Как пользоваться справочником</p>
      <h1>Читайте, сравнивайте и выбирайте следующий шаг</h1>
      <p className="lead narrow">
        MindTrack не проводит диагностику и не предлагает проходить тесты. Это справочник-помощник:
        он помогает подобрать понятные слова, увидеть похожие состояния и найти бережную практику.
      </p>
      <div className="help-grid">
        <article className="prose-block">
          <h2>Если хочется понять эмоцию</h2>
          <p>Откройте раздел эмоций и посмотрите, как состояние может проявляться в мыслях, теле и поведении.</p>
          <Link className="text-link" href="/emotions">Открыть эмоции <ArrowRight size={16} /></Link>
        </article>
        <article className="prose-block">
          <h2>Если важен контекст</h2>
          <p>Перегрузка, конфликт, потеря и неопределённость часто меняют наше самочувствие.</p>
          <Link className="text-link" href="/situations">Открыть ситуации <ArrowRight size={16} /></Link>
        </article>
        <article className="prose-block">
          <h2>Если нужен конкретный шаг</h2>
          <p>Выберите короткое упражнение: заземление, паузу, маленькие шаги или сообщение близкому.</p>
          <Link className="text-link" href="/tools">Открыть инструменты <ArrowRight size={16} /></Link>
        </article>
      </div>
    </section>
  );
}
