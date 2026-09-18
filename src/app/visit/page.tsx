import type { Metadata } from "next";
import { AppRouter } from "@/components/app/app-router";

export const metadata: Metadata = {
  title: "Подготовка к приёму — MindTrack",
  description: "Локальная сводка для разговора с психиатром или другим специалистом.",
};

export default function VisitPage() {
  return <AppRouter />;
}
