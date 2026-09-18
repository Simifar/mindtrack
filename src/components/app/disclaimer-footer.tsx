"use client";

import { useAppStore } from "@/store/app-store";

/**
 * Явный дисклеймер: приложение не диагностирует и не заменяет консультацию специалиста.
 */
export function DisclaimerFooter() {
  const setView = useAppStore((state) => state.setView);
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-start sm:gap-4">
          <p>
            <span className="font-semibold text-foreground">MindTrack — не медицинское ПО.</span>{" "}
            Результаты тестов — самонаблюдение, а не диагноз. Обсуждайте их с врачом /
            психотерапевтом. В непосредственной опасности: <a href="tel:112" className="font-medium text-foreground underline">112</a>. Детский телефон доверия: <a href="tel:88002000122" className="font-medium text-foreground underline">8-800-2000-122</a>.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} MindTrack · справочник тестов</span>
          <div className="flex flex-wrap items-center gap-3">
            <span>Без регистрации · данные хранятся только в вашем браузере</span>
            <button type="button" className="underline" onClick={() => setView("methods")}>О методиках и ограничениях</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
