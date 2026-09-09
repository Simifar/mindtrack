import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LocalJournal } from "@/components/local-journal";

export const metadata: Metadata = {
  title: "Наблюдать за собой",
  description: "Локальный дневник самонаблюдения без регистрации и без передачи данных на сервер.",
};

export default function JournalPage() {
  return (
    <section className="container section detail-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} /> Назад на главную
      </Link>
      <p className="eyebrow">Наблюдать за собой</p>
      <h1>Как я себя чувствую сейчас?</h1>
      <p className="lead narrow">
        Ведите краткий дневник локально в браузере: эмоция, интенсивность, мысли, тело, действие и то, что помогло.
      </p>
      <LocalJournal />
    </section>
  );
}
