"use client";
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-orange-200 bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-orange-100 bg-orange-50 p-4">
          <div className="mt-0.5 rounded-full bg-orange-100 p-2">
            <LifeBuoy className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-orange-900">{CRISIS_RESOURCES.title}</h2>
            <p className="mt-1 text-sm text-orange-800">{CRISIS_RESOURCES.body}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 p-4">
          {CRISIS_RESOURCES.lines.map((line) => (
            <a
              key={line.phone}
              href={line.href}
              className="flex items-center justify-between rounded-lg border bg-white p-3 transition hover:bg-accent"
            >
              <div>
                <div className="font-medium">{line.name}</div>
                <div className="text-sm text-muted-foreground">Анонимно · бесплатно</div>
              </div>
              <div className="flex items-center gap-2 font-mono font-semibold text-orange-700">
                <Phone className="h-4 w-4" />
                {line.phone}
              </div>
            </a>
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            Этот блок появился, потому что в ваших записях обнаружены слова, связанные с тяжёлыми
            переживаниями. MindTrack не уведомляет никого без вашего согласия — решение обратиться
            за помощью остаётся за вами.
          </p>
        </div>
      </div>
    </div>
  );
}
