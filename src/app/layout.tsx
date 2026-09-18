import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/app/theme-provider";

const basePath = process.env.PAGES_BASE_PATH || "";

export const metadata: Metadata = {
  title: "MindTrack — справочник психологических тестов",
  description:
    "Каталог скрининговых опросников самонаблюдения: PHQ-9, GAD-7, MDQ, ASRS, PSS-10, ISI, WHO-5. Без регистрации, результаты только в вашем браузере. Не медицинское ПО.",
  keywords: ["MindTrack", "PHQ-9", "GAD-7", "MDQ", "ASRS", "PSS-10", "ISI", "WHO-5", "психологические тесты"],
  authors: [{ name: "MindTrack" }],
  robots: { index: true, follow: true },
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico`, sizes: "any" },
      { url: `${basePath}/icon.svg`, type: "image/svg+xml" },
    ],
    apple: [{ url: `${basePath}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "MindTrack",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
