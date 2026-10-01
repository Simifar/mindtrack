"use client";

import { pathForView } from "@/lib/routes";
import { AppLink } from "./app-link";

const FOOTER_LINKS = [
  { label: "О методиках и ограничениях", view: "methods" as const },
  { label: "Помощь", view: "help" as const },
  { label: "Приватность", view: "privacy" as const },
];

/**
 * Явный дисклеймер: приложение не диагностирует и не заменяет консультацию специалиста.
 */
export function DisclaimerFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">MindTrack — не медицинское ПО.</span>{" "}
          Результаты тестов — самонаблюдение, а не диагноз. Обсуждайте их с врачом /
          психотерапевтом. В непосредственной опасности: <a href="tel:112" className="font-medium text-foreground underline underline-offset-2">112</a>. Детский телефон доверия в России: <a href="tel:88002000122" className="font-medium text-foreground underline underline-offset-2">8-800-2000-122</a> или <a href="tel:124" className="font-medium text-foreground underline underline-offset-2">124 с мобильного</a>.
        </p>
        <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} MindTrack · справочник тестов</span>
          <nav aria-label="Дополнительные разделы" className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Без регистрации · данные хранятся только в вашем браузере</span>
            {FOOTER_LINKS.map((link) => (
              <AppLink
                key={link.view}
                path={pathForView(link.view, null)}
                className="inline-flex min-h-11 items-center rounded-lg underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {link.label}
              </AppLink>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
