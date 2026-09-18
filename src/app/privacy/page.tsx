import type { Metadata } from "next";
import { AppRouter } from "@/components/app/app-router";

export const metadata: Metadata = {
  title: "Приватность — MindTrack",
  description: "Как MindTrack хранит результаты и черновики локально в браузере.",
};

export default function PrivacyPage() {
  return <AppRouter />;
}
