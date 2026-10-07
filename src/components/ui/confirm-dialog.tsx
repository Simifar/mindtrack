"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Подтверждение внутри приложения вместо window.confirm: понятные кнопки,
 * доступное имя, ловушка фокуса, Escape и возврат фокуса на исходный элемент.
 * Фокус по умолчанию — на безопасном действии «Отмена».
 */
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const close = useCallback(
    (value: boolean) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending],
  );

  return [confirm, pending ? <ConfirmDialog key="confirm" {...pending} onClose={close} /> : null];
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Отмена",
  destructive = false,
  onClose,
}: ConfirmOptions & { onClose: (value: boolean) => void }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled])"));
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

    document.addEventListener("keydown", handleKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  return (
    <div
      className="no-print animate-fade fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose(false);
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="animate-rise w-full max-w-md rounded-2xl border bg-card p-5 shadow-raised sm:p-6"
      >
        <h2 id={titleId} className="text-lg font-semibold leading-snug">{title}</h2>
        {description ? (
          <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="outline" onClick={() => onClose(false)}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={() => onClose(true)}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
