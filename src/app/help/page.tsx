import type { Metadata } from "next";
import { AppRouter } from "@/components/app/app-router";

export const metadata: Metadata = {
  title: "Помощь — MindTrack",
  description: "Контакты экстренной и психологической помощи.",
};

export default function HelpPage() {
  return <AppRouter />;
}
