import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BookOpen, Heart, Search } from "lucide-react";
import { Catalog } from "@/components/catalog";
import { topics } from "@/data/topics";
import { screeningScales } from "@/data/scales";
import { formatMaterialCount } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">MindTrack / справочник</p>
            <h1>Понятно о самонаблюдении и скрининговых шкалах</h1>
            <p className="lead">
              Русскоязычные материалы о настроении, тревоге, сне и внимании. Без регистрации,
              диагнозов и передачи персональных данных.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="#catalog">
                <Search size={18} /> Найти материал
              </Link>
              <Link className="button button-secondary" href="/topics">
                Все разделы <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="hero-note">
            <Heart size={24} aria-hidden="true" />
            <strong>Бережное знакомство</strong>
            <p>Шкалы помогают заметить изменения, но не заменяют консультацию специалиста.</p>
          </div>
        </div>
      </section>
      <section className="container section" id="catalog">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Каталог</p>
            <h2>Материалы для самостоятельного изучения</h2>
          </div>
          <span className="result-count">{formatMaterialCount(screeningScales.length)}</span>
        </div>
        <Suspense fallback={<div className="empty-state">Загрузка каталога…</div>}><Catalog items={screeningScales} topics={topics} /></Suspense>
      </section>
      <section className="container section topic-strip">
        <BookOpen size={22} />
        <div>
          <h2>С чего начать?</h2>
          <p>Выберите тему, которая сейчас ближе всего, и изучайте материалы в удобном темпе.</p>
        </div>
        <Link className="text-link" href="/topics">Открыть разделы <ArrowRight size={16} /></Link>
      </section>
    </>
  );
}
