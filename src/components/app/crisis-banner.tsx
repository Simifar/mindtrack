"use client";
import { useEffect, useRef } from "react";
import { CRISIS_RESOURCES } from "@/lib/crisis";
import { LifeBuoy, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

/**
 * Ненавязчивый, но заметный блок кризисной поддержки.
 * Показывается по флагу crisisOpen из store. Без автоуведомлений третьим лицам.
 */
export function CrisisBanner() {
  const open = useAppStore((s) => s.crisisOpen);
  const setOpen = useAppStore((s) => s.setCrisisOpen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    closeButtonRef.current?.focus();

    function focusableElements(): HTMLElement[] {
      if (!dialog) return [];
      return Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusableElements();
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crisis-dialog-title"
        aria-describedby="crisis-dialog-description"
        tabIndex={-1}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-orange-200 bg-white shadow-2xl dark:border-orange-800 dark:bg-card"
      >
        <div className="flex items-start gap-3 border-b border-orange-100 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/40">
          <div className="mt-0.5 rounded-full bg-orange-100 p-2">
            <LifeBuoy className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 id="crisis-dialog-title" className="font-semibold text-orange-900 dark:text-orange-200">
              {CRISIS_RESOURCES.title}
            </h2>
            <p id="crisis-dialog-description" className="mt-1 text-sm text-orange-800 dark:text-orange-100">{CRISIS_RESOURCES.body}</p>
          </div>
          <Button ref={closeButtonRef} variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 p-4">
          {CRISIS_RESOURCES.lines.map((line) => (
            <a
              key={line.phone}
              href={line.href}
              className="flex items-center justify-between rounded-lg border bg-card p-3 transition hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="font-medium">{line.name}</div>
                <div className="text-sm text-muted-foreground">{line.detail}</div>
                <div className="mt-1 break-words text-[11px] text-muted-foreground">Источник: {line.source} · проверено {line.checkedAt}</div>
              </div>
              <div className="flex items-center gap-2 font-mono font-semibold text-orange-700 dark:text-orange-300">
                <Phone className="h-4 w-4" />
                {line.phone}
              </div>
            </a>
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            Этот блок появился после ответа, который может указывать на тяжёлые переживания. MindTrack
            никого не уведомляет без вашего согласия — решение обратиться за помощью остаётся за вами.
          </p>
        </div>
      </div>
    </div>
  );
}
