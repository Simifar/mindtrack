import type { Metadata } from "next";
import { AppRouter } from "@/components/app/app-router";

export const metadata: Metadata = {
  title: "Тесты — MindTrack",
  description: "Каталог скрининговых опросников MindTrack: PHQ-9, GAD-7, ASRS, ISI, PSS-10, MDQ и WHO-5.",
};

export default function TestsPage() {
  return <AppRouter />;
}
