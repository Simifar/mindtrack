"use client";
import { BookHeart, ClipboardList, ClipboardPenLine, History, Info } from "lucide-react";
import { usePathname } from "next/navigation";
import { navigateToView } from "@/lib/navigation";
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
    <div className="flex items-center gap-2.5">
      <MindTrackMark className="h-9 w-9 shrink-0 rounded-xl shadow-sm" />
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-tight">MindTrack</div>
        <div className="text-[10px] text-muted-foreground">справочник тестов</div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const route = routeFromPath(pathname);

  const active = (id: ViewId) => route.view === id || (id === "tests" && (route.view === "test-detail" || route.view === "test-run"));

  return (
    <div className="app-shell flex min-h-screen bg-background">
      {/* Десктоп: левый sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card/60 backdrop-blur md:flex">
        <div className="px-5 py-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigateToView(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active(item.id)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-5 pb-4 text-[11px] leading-relaxed text-muted-foreground">
          Результаты хранятся только в вашем браузере. Никаких аккаунтов.
        </div>
      </aside>

      {/* Основная колонка */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Мобильный top-bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/80 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <ThemeToggle />
        </header>

        {/* Десктопная шапка с переключателем темы */}
        <header className="sticky top-0 z-30 hidden items-center justify-end border-b bg-card/80 px-6 py-3 backdrop-blur md:flex">
          <ThemeToggle />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-8">{children}</main>

        <DisclaimerFooter />
      </div>

      {/* Основная навигация: плавающая панель доступна на всех размерах экрана. */}
      <nav aria-label="Основная навигация" className="bottom-nav fixed z-40 backdrop-blur-xl backdrop-saturate-150">
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
                  "flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] px-1 py-2 text-center text-[0.6875rem] font-medium leading-tight transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-xs",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="max-w-full break-words">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <CrisisBanner />
    </div>
  );
}
