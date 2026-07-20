"use client";
import { ShieldAlert } from "lucide-react";

/**
 * Явный дисклеймер: приложение не диагностирует и не заменяет консультацию специалиста.
 * Обязателен на главном экране и в футере.
 */
export function DisclaimerFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-start sm:gap-4">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              <span className="font-semibold text-foreground">MindTrack — не медицинское ПО.</span>{" "}
              Приложение не ставит диагнозы и не заменяет консультацию специалиста. Результаты тестов
              носят характер самонаблюдения и должны обсуждаться с лечащим врачом / психотерапевтом.
              В кризисной ситуации звоните: <a href="tel:88002000122" className="font-medium text-foreground underline">8-800-2000-122</a> (круглосуточно, анонимно).
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} MindTrack · self-tracker психического состояния</span>
          <span>Данные шифруются на уровне приложения · экспорт и удаление — в один клик</span>
        </div>
      </div>
    </footer>
  );
}
