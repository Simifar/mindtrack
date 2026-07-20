"use client";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  LineChart,
  FileDown,
  Settings,
  Brain,
  LogOut,
} from "lucide-react";
import { useAppStore, type ViewId } from "@/store/app-store";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CrisisBanner } from "./crisis-banner";
import { DisclaimerFooter } from "./disclaimer-footer";

const NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "tests", label: "Тесты", icon: ClipboardList },
  { id: "diary", label: "Дневник", icon: BookOpen },
  { id: "charts", label: "Графики", icon: LineChart },
  { id: "export", label: "Отчёт врачу", icon: FileDown },
  { id: "settings", label: "Настройки", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const setUser = useAppStore((s) => s.setUser);
  const { toast } = useToast();

  // Поднимаем crisis-баннер если в store когда-либо установлен флаг (слушаем через подписку).
  // Сбрасываем при смене вью.
  useEffect(() => {
    useAppStore.setState({ crisisOpen: false });
  }, [view]);

  async function logout() {
    try {
      await api.auth.logout();
      toast({ title: "Вы вышли из аккаунта" });
    } catch {
      /* ignore */
    }
    setUser(null);
  }

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
            <div className="text-[10px] text-muted-foreground">self-tracker</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id || (item.id === "tests" && view === "test-runner");
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
        <div className="border-t p-3">
          <div className="mb-2 truncate px-3 text-xs text-muted-foreground" title={user?.email}>
            {user?.email}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
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
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Выйти">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        <DisclaimerFooter />
      </div>

      {/* Мобильный bottom-nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.filter((n) => n.id !== "settings").map((item) => {
          const Icon = item.icon;
          const active = view === item.id || (item.id === "tests" && view === "test-runner");
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
