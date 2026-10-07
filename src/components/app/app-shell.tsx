"use client";
import { BookHeart, ClipboardList, ClipboardPenLine, History, House, Info, LifeBuoy } from "lucide-react";
import { usePathname } from "next/navigation";
import { pathForView, routeFromPath, type ViewId } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { CrisisBanner } from "./crisis-banner";
import { DisclaimerFooter } from "./disclaimer-footer";
import { MindTrackMark } from "./mindtrack-logo";
import { AppLink } from "./app-link";

const NAV: { id: ViewId; label: string; icon: typeof ClipboardList }[] = [
  { id: "home", label: "Главная", icon: House },
  { id: "tests", label: "Тесты", icon: ClipboardList },
  { id: "diary", label: "Дневник", icon: BookHeart },
  { id: "visit", label: "К врачу", icon: ClipboardPenLine },
  { id: "results", label: "История", icon: History },
  { id: "methods", label: "Методики", icon: Info },
];

/** Нижняя панель вмещает пять пунктов; «Методики» доступны из рейла, футера и страниц тестов. */
const MOBILE_NAV: ViewId[] = ["home", "tests", "diary", "visit", "results"];

/** Группы рейла: обзор, действия, собственные записи и справка. */
const NAV_GROUPS: { title: string; ids: ViewId[] }[] = [
  { title: "Обзор", ids: ["home"] },
  { title: "Пройти", ids: ["tests"] },
  { title: "Мои данные", ids: ["diary", "visit", "results"] },
  { title: "Справка", ids: ["methods"] },
];

const VIEW_TITLES: Record<ViewId, string> = {
  home: "Главная",
  tests: "Каталог тестов",
  "test-detail": "Тесты",
  "test-run": "Тесты",
  diary: "Дневник состояния",
  visit: "Подготовка к приёму",
  results: "История результатов",
  methods: "О методиках и ограничениях",
  help: "Помощь",
  privacy: "Приватность",
};

/**
 * Переходы внутри приложения без перезагрузки документа: ссылка остаётся
 * настоящей (новая вкладка, копирование адреса), но обычный клик идёт через
 * history.pushState. Так док на мобильном не «мигает» полной загрузкой.
 */
function Logo() {
  return (
    <AppLink
      path="/"
      aria-label="MindTrack — на главную"
      className="flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <MindTrackMark className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight">MindTrack</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">самонаблюдение и подготовка</div>
      </div>
    </AppLink>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const route = routeFromPath(pathname);

  const active = (id: ViewId) => route.view === id || (id === "tests" && (route.view === "test-detail" || route.view === "test-run"));
  const sectionTitle = VIEW_TITLES[route.view];

  return (
    <div className="app-shell flex min-h-screen bg-background">
      <a href="#main-content" className="skip-link">К основному содержимому</a>
      {/* Десктоп: левый sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-[16.5rem] shrink-0 flex-col border-r border-border/70 bg-surface/60 lg:flex">
        <div className="px-6 py-6">
          <Logo />
        </div>
        <nav aria-label="Основные разделы" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
                {group.title}
              </p>
              {group.ids.map((id) => {
                const item = NAV.find((entry) => entry.id === id);
                if (!item) return null;
                const Icon = item.icon;
                const isActive = active(item.id);
                const path = pathForView(item.id, null);
                return (
                  <AppLink
                    key={item.id}
                    path={path}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      isActive
                        ? "bg-card font-semibold text-foreground shadow-card before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary"
                        : "font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {item.label}
                  </AppLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="space-y-3 px-5 pb-5">
          <div className="rounded-2xl border border-border/80 bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Только на этом устройстве</p>
            <p className="mt-1">Без аккаунта и отправки ответов на сервер.</p>
          </div>
          <AppLink
            path="/help"
            className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <LifeBuoy aria-hidden="true" className="h-4 w-4" /> Помощь
          </AppLink>
          <AppLink
            path="/privacy"
            className="flex min-h-11 items-center rounded-xl px-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            Приватность и удаление данных
          </AppLink>
        </div>
      </aside>

      {/* Основная колонка */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Мобильный top-bar */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/70 bg-background/85 px-4 py-2.5 backdrop-blur lg:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <AppLink
              path="/help"
              aria-label="Помощь"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <LifeBuoy aria-hidden="true" className="h-5 w-5" />
            </AppLink>
            <ThemeToggle />
          </div>
        </header>

        {/* Десктопная шапка: раздел виден и после прокрутки страницы */}
        <header className="no-print sticky top-0 z-30 hidden items-center justify-between gap-3 border-b border-border/70 bg-background/85 px-10 py-2.5 backdrop-blur lg:flex">
          <p className="truncate text-xs font-medium text-muted-foreground">{sectionTitle}</p>
          <ThemeToggle />
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-6 outline-none sm:px-7 sm:pt-9 lg:px-10">{children}</main>

        <DisclaimerFooter />
      </div>

      {/* Основная навигация: плавающая панель для мобильных и планшетных экранов. */}
      <nav aria-label="Основная навигация" className="bottom-nav fixed z-40 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
        <div className="grid grid-cols-5 gap-1 p-1.5">
          {MOBILE_NAV.map((id) => {
            const item = NAV.find((entry) => entry.id === id);
            if (!item) return null;
            const Icon = item.icon;
            const isActive = active(item.id);
            const path = pathForView(item.id, null);
            return (
              <AppLink
                key={item.id}
                path={path}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] px-1 py-2 text-center text-[0.625rem] font-medium leading-tight transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-[380px]:text-[0.6875rem]",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="max-w-full whitespace-nowrap">{item.label}</span>
              </AppLink>
            );
          })}
        </div>
      </nav>

      <CrisisBanner />
    </div>
  );
}
