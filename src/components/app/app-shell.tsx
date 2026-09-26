"use client";
import { BookHeart, ClipboardList, ClipboardPenLine, History, Info, LifeBuoy } from "lucide-react";
import { usePathname } from "next/navigation";
import { pathForView, routeFromPath, type ViewId } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { CrisisBanner } from "./crisis-banner";
import { DisclaimerFooter } from "./disclaimer-footer";
import { MindTrackMark } from "./mindtrack-logo";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const NAV: { id: ViewId; label: string; icon: typeof ClipboardList }[] = [
  { id: "tests", label: "Тесты", icon: ClipboardList },
  { id: "diary", label: "Дневник", icon: BookHeart },
  { id: "visit", label: "К врачу", icon: ClipboardPenLine },
  { id: "results", label: "Результаты", icon: History },
  { id: "methods", label: "Методики", icon: Info },
];

function Logo() {
  return (
    <a href={`${BASE_PATH}/tests`} aria-label="MindTrack — к каталогу тестов" className="flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
      <MindTrackMark className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight">MindTrack</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">самонаблюдение и подготовка</div>
      </div>
    </a>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const route = routeFromPath(pathname);

  const active = (id: ViewId) => route.view === id || (id === "tests" && (route.view === "test-detail" || route.view === "test-run"));

  return (
    <div className="app-shell flex min-h-screen bg-background">
      <a href="#main-content" className="skip-link">К основному содержимому</a>
      {/* Десктоп: левый sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 flex-col border-r border-border/80 bg-card/75 backdrop-blur lg:flex">
        <div className="px-6 py-6">
          <Logo />
        </div>
        <nav aria-label="Основные разделы" className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active(item.id);
            return (
              <a
                key={item.id}
                href={`${BASE_PATH}${pathForView(item.id, null)}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="space-y-4 px-5 pb-5">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Только на этом устройстве</p>
            <p className="mt-1">Без аккаунта и отправки ответов на сервер.</p>
          </div>
          <a href={`${BASE_PATH}/help`} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring">
            <LifeBuoy aria-hidden="true" className="h-4 w-4" /> Помощь
          </a>
          <a href={`${BASE_PATH}/privacy`} className="block px-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Приватность и удаление данных</a>
        </div>
      </aside>

      {/* Основная колонка */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Мобильный top-bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <a href={`${BASE_PATH}/help`} aria-label="Помощь" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring">
              <LifeBuoy aria-hidden="true" className="h-5 w-5" />
            </a>
            <ThemeToggle />
          </div>
        </header>

        {/* Десктопная шапка с переключателем темы */}
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-border/80 bg-card/85 px-8 py-3 backdrop-blur lg:flex">
          <p className="text-xs text-muted-foreground">Локальный справочник · ответы остаются в браузере</p>
          <ThemeToggle />
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pb-8">{children}</main>

        <DisclaimerFooter />
      </div>

      {/* Основная навигация: плавающая панель для мобильных и планшетных экранов. */}
      <nav aria-label="Основная навигация" className="bottom-nav fixed z-40 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="grid grid-cols-5 gap-1 p-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active(item.id);
            return (
              <a
                key={item.id}
                href={`${BASE_PATH}${pathForView(item.id, null)}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] px-1 py-2 text-center text-[0.625rem] font-medium leading-tight transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-xs",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="max-w-full whitespace-nowrap">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <CrisisBanner />
    </div>
  );
}
