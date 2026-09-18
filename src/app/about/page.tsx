import type { Metadata } from "next";
import { AppRouter } from "@/components/app/app-router";

export const metadata: Metadata = {
  title: "О методиках и ограничениях — MindTrack",
  description: "Источники, версии форм и ограничения скрининговых опросников MindTrack.",
};

export default function AboutPage() {
  return <AppRouter />;
}
