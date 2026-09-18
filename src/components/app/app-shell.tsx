"use client";
import { ClipboardList, History, Brain } from "lucide-react";
import { useAppStore, type ViewId } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { CrisisBanner } from "./crisis-banner";
import { DisclaimerFooter } from "./disclaimer-footer";

const NAV: { id: ViewId; label: string; icon: typeof ClipboardList }[] = [
  { id: "tests", label: "Тесты", icon: ClipboardList },
  { id: "results", label: "Результаты", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Десктоп: левый sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">MindTrack</div>
            <div className="text-[10px] text-muted-foreground">справочник тестов</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id || (item.id === "tests" && view === "test-run");
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Контент + мобильный top-bar */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <span className="font-bold">MindTrack</span>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        <DisclaimerFooter />
      </div>

      {/* Мобильный bottom-nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id || (item.id === "tests" && view === "test-run");
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
                active ? "text-primary" : "text-muted-foreground"
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

