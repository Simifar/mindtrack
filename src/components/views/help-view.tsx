"use client";

import { ArrowLeft, Phone } from "lucide-react";
import { CRISIS_RESOURCES } from "@/lib/crisis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLink } from "@/components/app/app-link";

export function HelpView() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild>
        <AppLink path="/tests">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> К каталогу тестов
        </AppLink>
      </Button>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Помощь</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Если вам тяжело, выберите подходящий ресурс. MindTrack не оценивает непосредственный риск.
        </p>
      </header>

      <section
        aria-labelledby="urgent-help"
        className="rounded-2xl border border-attention/40 bg-attention-surface p-4 text-attention-foreground"
      >
        <h2 id="urgent-help" className="font-semibold">Если опасность непосредственная</h2>
        <p className="mt-1 text-sm leading-relaxed">
          Позвоните 112 или попросите близкого человека побыть рядом. Не оставайтесь в одиночестве, если чувствуете, что можете причинить себе вред.
        </p>
        <a
          href="tel:112"
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-attention/15 px-4 text-base font-semibold tabular-nums transition hover:bg-attention/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Phone aria-hidden="true" className="h-4 w-4" />
          112
        </a>
      </section>

      <section aria-labelledby="help-lines" className="space-y-2">
        <h2 id="help-lines" className="text-lg font-semibold">Круглосуточные линии поддержки</h2>
        <ul className="space-y-2">
          {CRISIS_RESOURCES.lines.map((line) => (
            <li key={line.phone}>
              <a
                href={line.href}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{line.name}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{line.detail}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 font-mono font-semibold tabular-nums text-attention-foreground">
                  <Phone aria-hidden="true" className="h-4 w-4" />
                  {line.phone}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Card className="shadow-none">
        <CardHeader><CardTitle as="h2" className="text-lg">Что MindTrack не делает</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>Не ставит диагноз и не оценивает риск. Не передаёт ответы никому и никого не уведомляет. Не заменяет разговор со специалистом или экстренную помощь.</p>
        </CardContent>
      </Card>
    </div>
  );
}
