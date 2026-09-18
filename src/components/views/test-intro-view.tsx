"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, Play, RotateCcw, Users } from "lucide-react";
import { getTest } from "@/data/tests";
import { deleteDraft, loadDraft } from "@/lib/progress";
import { navigateToTestRun, navigateToView } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TestIntroView({ code }: { code: string }) {
  const def = getTest(code);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHasDraft(Boolean(loadDraft(code))), 0);
    return () => window.clearTimeout(timer);
  }, [code]);

  if (!def) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Button variant="ghost" onClick={() => navigateToView("tests")}><ArrowLeft className="h-4 w-4" /> К каталогу тестов</Button>
        <p className="text-muted-foreground">Тест не найден.</p>
      </div>
    );
  }

  const recallPeriod = code === "PSS10" ? "Последний месяц" : code === "ASRS" ? "Последние 6 месяцев" : code === "MDQ" ? "За всю жизнь" : "Последние 2 недели";

  function start() {
    navigateToTestRun(code);
  }

  function resetDraft() {
    deleteDraft(code);
    setHasDraft(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" onClick={() => navigateToView("tests")}><ArrowLeft className="h-4 w-4" /> К каталогу тестов</Button>
      <Card>
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Перед началом</p>
          <CardTitle className="text-2xl">{def.name}</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">{def.description}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/60 p-3"><Clock3 className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Время</p><p className="font-medium">Около {def.estimatedMinutes ?? 5} минут</p></div>
            <div className="rounded-lg bg-muted/60 p-3"><Users className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Кому подходит</p><p className="font-medium">{def.ageGroup ?? "Уточните у специалиста"}</p></div>
            <div className="rounded-lg bg-muted/60 p-3"><RotateCcw className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Период вопросов</p><p className="font-medium">{recallPeriod}</p></div>
          </div>
          <div className="rounded-lg border p-4 text-sm leading-relaxed text-muted-foreground">
            Ответы сохраняются только в этом браузере. Если закрыть страницу, незавершённое прохождение можно будет продолжить с последнего вопроса.
            {code === "MDQ" && " Для MDQ важны не только 13 симптомов: результат также учитывает, совпадали ли они по времени и насколько влияли на жизнь."}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={start} className="flex-1"><Play className="h-4 w-4" />{hasDraft ? "Продолжить прохождение" : "Начать тест"}</Button>
            {hasDraft && <Button variant="outline" onClick={resetDraft}>Начать заново</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
