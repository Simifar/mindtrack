import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { CheckInFlow } from "@/components/check-in-flow";

export const metadata: Metadata = {
  title: "Разобраться в себе",
  description: "Короткий маршрут самонаблюдения: что сейчас ощущается, где это чувствуется и что может помочь.",
};

export default function CheckInPage() {
  return (
    <section className="container section detail-page">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} /> Назад на главную
      </Link>
      <p className="eyebrow">Разобраться в себе</p>
      <h1>Что с тобой сейчас?</h1>
      <p className="lead narrow">
        Не нужно сразу подбирать диагноз. Ответь на несколько простых вопросов, чтобы увидеть возможные переживания,
        направленность и безопасный следующий шаг.
      </p>
      <CheckInFlow />
    </section>
  );
}
