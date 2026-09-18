import type { Metadata } from "next";
import { AppRouter } from "@/components/app/app-router";

export const metadata: Metadata = {
  title: "Результаты — MindTrack",
  description: "Локальная история результатов MindTrack без регистрации и отправки ответов на сервер.",
};

export default function ResultsPage() {
  return <AppRouter />;
}
