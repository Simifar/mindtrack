"use client";
import { Brain, ClipboardList, History, Info } from "lucide-react";
import { useAppStore, type ViewId } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { CrisisBanner } from "./crisis-banner";
import { DisclaimerFooter } from "./disclaimer-footer";

const NAV: { id: ViewId; label: string; icon: typeof ClipboardList }[] = [
  { id: "tests", label: "Тесты", icon: ClipboardList },
  { id: "results", label: "Результаты", icon: History },
  { id: "methods", label: "Методики", icon: Info },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
        <Brain className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-tight">MindTrack</div>
        <div className="text-[10px] text-muted-foreground">справочник тестов</div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  const active = (id: ViewId) => view === id || (id === "tests" && (view === "test-detail" || view === "test-run"));

  return (
    <div className="flex min-h-screen bg-background">
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
                onClick={() => setView(item.id)}
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

      {/* Мобильный bottom-nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition",
                active(item.id) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <CrisisBanner />
    </div>
  );
}
