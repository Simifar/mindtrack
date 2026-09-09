import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Heart, NotebookPen, Star } from "lucide-react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.github.io/MindTrack";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "MindTrack — справочник о самонаблюдении", template: "%s — MindTrack" },
  description: "Русскоязычный статический справочник о настроении, тревоге, сне и внимании.",
  alternates: { canonical: "/" },
  openGraph: { title: "MindTrack", description: "Справочник о самонаблюдении", type: "website", images: [`${basePath}/og.png`] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <a className="skip-link" href="#main-content">К содержимому</a>
        <header className="site-header">
          <div className="container header-inner">
            <Link className="brand" href="/"><span className="brand-mark"><Heart size={17} /></span> MindTrack</Link>
            <nav aria-label="Основная навигация">
              <Link href="/emotions"><BookOpen size={16} /> Эмоции</Link>
              <Link href="/situations"><BookOpen size={16} /> Ситуации</Link>
              <Link href="/tools"><BookOpen size={16} /> Инструменты</Link>
              <Link href="/journal"><NotebookPen size={16} /> Дневник</Link>
              <Link href="/help"><BookOpen size={16} /> Помощь</Link>
              <Link href="/topics"><BookOpen size={16} /> Разделы</Link>
              <Link href="/favorites"><Star size={16} /> Избранное</Link>
            </nav>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <span>MindTrack — справочный проект, не медицинская рекомендация.</span>
            <Link href="/topics">Каталог материалов</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
