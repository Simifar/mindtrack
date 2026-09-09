import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { ResultsManager } from "@/components/results-manager";
import { screeningScales } from "@/data/scales";

export const metadata: Metadata = { title: "Мои результаты", description: "Локальный импорт и хранение результатов тестов без регистрации." };

export default function ResultsPage() {
  return <section className="container section detail-page"><Link className="back-link" href="/scales"><ArrowLeft size={16} /> В каталог тестов</Link><p className="eyebrow">Локально на устройстве</p><h1>Мои результаты</h1><p className="lead narrow">Сохраняйте баллы после прохождения теста или импортируйте их из файла. Результаты не отправляются на сервер и доступны только в этом браузере.</p><Suspense fallback={<div className="empty-state">Загрузка формы…</div>}><ResultsManager scales={screeningScales} /></Suspense></section>;
}
