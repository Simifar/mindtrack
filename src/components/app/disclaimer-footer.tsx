"use client";

/**
 * Явный дисклеймер: приложение не диагностирует и не заменяет консультацию специалиста.
 */
export function DisclaimerFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-start sm:gap-4">
          <p>
            <span className="font-semibold text-foreground">MindTrack — не медицинское ПО.</span>{" "}
            Результаты тестов — самонаблюдение, а не диагноз. Обсуждайте их с врачом /
            психотерапевтом. В кризисе: <a href="tel:88002000122" className="font-medium text-foreground underline">8-800-2000-122</a> (круглосуточно, анонимно).
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} MindTrack · справочник тестов</span>
          <span>Без регистрации · данные хранятся только в вашем браузере</span>
        </div>
      </div>
    </footer>
  );
}

