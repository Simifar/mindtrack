import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BookOpen, Heart, Search, ShieldAlert } from "lucide-react";
import { Catalog } from "@/components/catalog";
import { emotionPreview, supportActions, symptomPaths } from "@/data/journey";
import { screeningScales } from "@/data/scales";
import { topics } from "@/data/topics";
import { formatMaterialCount } from "@/lib/catalog";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">MindTrack / справочник-помощник</p>
            <h1>Понятно о том, что с нами происходит</h1>
            <p className="lead">
              Спокойный русскоязычный справочник о переживаниях, ситуациях и практических шагах.
              Читайте в удобном порядке, находите подходящие материалы и решайте, что может помочь именно сейчас.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/emotions">
                <BookOpen size={18} /> Разобраться в эмоциях
              </Link>
              <Link className="button button-secondary" href="#catalog">
                <Search size={18} /> Найти материал
              </Link>
            </div>
          </div>
          <div className="hero-note">
            <Heart size={24} aria-hidden="true" />
            <strong>Без диагнозов и самотестов</strong>
            <p>Материалы помогают подобрать слова, увидеть контекст и найти следующий безопасный шаг.</p>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Навигация по справочнику</p>
            <h2>С чего начать чтение</h2>
          </div>
        </div>
        <div className="path-grid">
          {symptomPaths.map((path) => (
            <Link className="path-card" href={path.href} key={path.id}>
              <strong>{path.title}</strong>
              <p>{path.description}</p>
              <span className="text-link">
                Перейти <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Что можно сделать сейчас</p>
            <h2>Практические шаги по цели</h2>
          </div>
        </div>
        <div className="card-grid">
          {supportActions.map((action) => (
            <article className="scale-card" key={action.title}>
              <span className="tag">{action.title}</span>
              <h3>{action.summary}</h3>
              <ul className="mini-list">
                {action.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Эмоции простыми словами</p>
            <h2>Слова, которые помогают назвать состояние</h2>
          </div>
          <Link className="text-link" href="/emotions">
            Все эмоции <ArrowRight size={16} />
          </Link>
        </div>
        <div className="tool-links-row">
          <Link className="button button-secondary" href="/tools">Что можно сделать сейчас</Link>
          <Link className="button button-secondary" href="/situations">Ситуации и контексты</Link>
        </div>
        <div className="card-grid">
          {emotionPreview.map((emotion) => (
            <article className="scale-card" key={emotion.title}>
              <span className="tag">эмоция</span>
              <h3>{emotion.title}</h3>
              <p>{emotion.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container section more-space">
        <div className="topic-strip">
          <BookOpen size={22} />
          <div>
            <h2>Наблюдать за собой</h2>
            <p>Локальный дневник без регистрации помогает заметить паттерны и то, что действительно помогает.</p>
          </div>
          <Link className="text-link" href="/journal">Открыть дневник <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Получить помощь</p>
            <h2>Понимать, когда важно обратиться дальше</h2>
          </div>
          <Link className="text-link" href="/help">
            Открыть справку <ArrowRight size={16} />
          </Link>
        </div>
        <div className="notice">
          <ShieldAlert size={18} aria-hidden="true" />
          <div>
            <strong>Главная рекомендация</strong>
            <p>Не стоит пытаться ставить диагноз самостоятельно. Полезнее назвать состояние, понять контекст и решить, что сейчас поддерживает безопасный следующий шаг.</p>
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
        <Suspense fallback={<div className="empty-state">Загрузка каталога…</div>}>
          <Catalog items={screeningScales} topics={topics} />
        </Suspense>
      </section>
    </>
  );
}
