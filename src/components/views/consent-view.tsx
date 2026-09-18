"use client";
import { useState } from "react";
import { api, type AppUser } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Loader2 } from "lucide-react";

export function ConsentView({ user: _user, onDone }: { user: AppUser; onDone: (u: AppUser) => void }) {
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function accept() {
    setLoading(true);
    try {
      const { user: u } = await api.consent.accept();
      onDone(u);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2.5">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Согласие на обработку данных</h1>
            <p className="text-sm text-muted-foreground">
              О ментальном здоровье — чувствительная категория
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            MindTrack — это инструмент <span className="font-medium text-foreground">самонаблюдения</span>,
            а не медицинское приложение. Он не ставит диагнозы и не заменяет консультацию специалиста.
          </p>
          <p>Собираемые данные включают:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>результаты опросников (PHQ-9, GAD-7 и др.)</li>
            <li>записи дневника настроения, сна, энергии и заметки</li>
            <li>историю сформированных отчётов</li>
          </ul>
          <p>
            Эти данные <span className="font-medium text-foreground">шифруются</span> на уровне
            приложения (AES-256-GCM) в дополнение к TLS при передаче. Доступ к ним есть только у вас.
          </p>
          <p>
            Вы можете <span className="font-medium text-foreground">экспортировать</span> все данные в
            JSON одним кликом и <span className="font-medium text-foreground">полностью удалить</span>{" "}
            аккаунт вместе со всеми записями в любой момент (право на забвение).
          </p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            В кризисной ситуации (мысли о причинении себе вреда) приложение покажет блок с номером
            горячей линии — без уведомления третьих лиц без вашего согласия.
          </p>
        </div>

        <div
          role="checkbox"
          aria-checked={agree}
          tabIndex={0}
          onClick={() => setAgree((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setAgree((v) => !v);
            }
          }}
          className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition hover:bg-accent"
        >
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
          <span className="text-sm">
            Я понимаю, что это не медицинское ПО, и соглашаюсь на обработку моих данных
            самонаблюдения. Я могу отозвать согласие, удалив аккаунт.
          </span>
        </div>

        <Button className="mt-5 w-full" disabled={!agree || loading} onClick={accept}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Принять и продолжить
        </Button>
      </div>
    </div>
  );
}
