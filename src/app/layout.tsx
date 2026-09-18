import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/app/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "MindTrack — справочник психологических тестов",
  description:
    "Каталог скрининговых опросников самонаблюдения: PHQ-9, GAD-7, MDQ, ASRS, PSS-10, ISI, WHO-5. Без регистрации, результаты только в вашем браузере. Не медицинское ПО.",
  keywords: ["MindTrack", "PHQ-9", "GAD-7", "MDQ", "ASRS", "PSS-10", "ISI", "WHO-5", "психологические тесты"],
  authors: [{ name: "MindTrack" }],
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
