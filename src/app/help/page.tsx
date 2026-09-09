import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, HeartHandshake, MessageCircle } from "lucide-react";
import { helpSignals } from "@/data/journey";

export const metadata: Metadata = {
  title: "Получить помощь",
  description: "Когда достаточно самонаблюдения, когда нужно поговорить с близким и когда лучше обратиться за профессиональной поддержкой.",
};

export default function HelpPage() {
  return (
    <section className="container section detail-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} /> Назад на главную
      </Link>
      <p className="eyebrow">Получить помощь</p>
      <h1>Когда стоит обратиться за поддержкой</h1>
      <p className="lead narrow">
        Это не медицинская карта и не диагноз. Это практический ориентир: что можно сделать самостоятельно, а когда лучше
        поговорить с человеком, который рядом, или с профессионалом.
      </p>

      <div className="help-grid">
        <article className="prose-block">
          <MessageCircle size={20} aria-hidden="true" />
          <h2>Когда достаточно самонаблюдения</h2>
          <ul>
            <li>Дискомфорт краткий и понятный.</li>
            <li>Есть возможность замедлиться, отдохнуть и выбрать следующий шаг.</li>
            <li>Нет сильной потери контроля, угрозы для себя или окружающих.</li>
          </ul>
        </article>

        <article className="prose-block">
          <HeartHandshake size={20} aria-hidden="true" />
          <h2>Когда стоит поговорить с близким</h2>
          <ul>
            <li>Сейчас тяжело держать всё внутри.</li>
            <li>Есть чувство изоляции, усталости или сложности в отношениях.</li>
            <li>Нужна просто чья-то поддержка и безопасное пространство для разговора.</li>
          </ul>
        </article>

        <article className="prose-block">
          <AlertTriangle size={20} aria-hidden="true" />
          <h2>Когда лучше обратиться к специалисту</h2>
          <ul>
            <li>Сильное напряжение не отпускает несколько дней.</li>
            <li>Сложно справляться с обычной жизнью и рутиной.</li>
            <li>Есть выраженная тревога, панические эпизоды, сильная подавленность или признаки необходимости медицинской помощи.</li>
          </ul>
        </article>
      </div>

      <div className="notice">
        <strong>Признаки, при которых важна срочная помощь</strong>
        <ul>
          {helpSignals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
