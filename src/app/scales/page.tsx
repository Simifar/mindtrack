import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { screeningScales } from "@/data/scales";
import { topics } from "@/data/topics";

export const metadata: Metadata = { title: "Каталог тестов", description: "Каталог скрининговых тестов и шкал MindTrack." };

export default function ScalesPage() {
  return <section className="container section"><p className="eyebrow">Главный каталог</p><h1>Тесты и шкалы</h1><p className="lead narrow">Выберите тест, ознакомьтесь с его назначением и сохраните результат, полученный у специалиста или в другом сервисе.</p><Suspense fallback={<div className="empty-state">Загрузка каталога…</div>}><Catalog items={screeningScales} topics={topics} /></Suspense></section>;
}
