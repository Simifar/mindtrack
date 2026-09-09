import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ClipboardList, LockKeyhole, Upload } from "lucide-react";
import { Catalog } from "@/components/catalog";
import { screeningScales } from "@/data/scales";
import { topics } from "@/data/topics";

export const metadata: Metadata = {
  title: "Каталог психологических тестов",
  description: "Каталог скрининговых тестов и локальное сохранение результатов без регистрации.",
};

export default function HomePage() {
  return (
    <>
      <section className="hero catalog-hero">
        <div className="container">
          <p className="eyebrow">MindTrack / каталог тестов</p>
          <h1>Выберите тест, сохраните результат, наблюдайте динамику</h1>
          <p className="lead">
            Справочник скрининговых шкал на русском языке. Здесь можно понять,
            для чего нужен тест, а результат сохранить локально — без аккаунта и отправки данных на сервер.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#catalog"><ClipboardList size={18} /> Смотреть каталог</a>
            <Link className="button button-secondary" href="/results"><Upload size={18} /> Мои результаты</Link>
          </div>
        </div>
      </section>

      <section className="container section" id="catalog">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Все тесты</p>
            <h2>Каталог</h2>
            <p className="muted">Фильтруйте по названию или разделу и открывайте подробную карточку.</p>
          </div>
          <span className="result-count">{screeningScales.length} теста</span>
        </div>
        <Suspense fallback={<div className="empty-state">Загрузка каталога…</div>}>
          <Catalog items={screeningScales} topics={topics} />
        </Suspense>
      </section>

      <section className="container section">
        <div className="how-it-works">
          <div><LockKeyhole size={22} /><strong>Локальное хранение</strong><p>Результаты остаются в браузере на вашем устройстве.</p></div>
          <div><ClipboardList size={22} /><strong>Без самодиагностики</strong><p>Тесты помогают заметить состояние, но не заменяют специалиста.</p></div>
          <Link className="text-link" href="/help">О безопасном использовании <ArrowRight size={16} /></Link>
        </div>
      </section>
    </>
  );
}
