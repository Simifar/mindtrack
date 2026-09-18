import type { Metadata } from "next";
import { AppRouter } from "@/components/app/app-router";

export const metadata: Metadata = {
  title: "Дневник состояния — MindTrack",
  description: "Локальный дневник настроения, сна, активности и факторов дня.",
};

export default function DiaryPage() {
  return <AppRouter />;
}
