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
  title: "MindTrack — self-tracker психического состояния",
  description:
    "Персональный self-tracker психического состояния. Опросники, дневник настроения, графики и отчёт для врача. Не медицинское ПО.",
  keywords: ["MindTrack", "self-tracker", "PHQ-9", "GAD-7", "ментальное здоровье", "дневник настроения"],
  authors: [{ name: "MindTrack" }],
  robots: { index: false, follow: false },
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
