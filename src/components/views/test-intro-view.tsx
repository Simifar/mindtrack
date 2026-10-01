"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, ExternalLink, Play, RotateCcw, Users } from "lucide-react";
import { getTest } from "@/data/tests";
import { deleteDraft, loadDraft, type TestDraft } from "@/lib/progress";
import { navigateToTestRun, navigateToView } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TestIntroView({ code }: { code: string }) {
  const def = getTest(code);
  const [draft, setDraft] = useState<TestDraft | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraft(loadDraft(code));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [code]);

  if (!def) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Button variant="ghost" onClick={() => navigateToView("tests")}><ArrowLeft aria-hidden="true" className="h-4 w-4" /> К каталогу тестов</Button>
        <p className="text-muted-foreground">Тест не найден.</p>
      </div>
    );
  }

  const recallPeriod = code === "PSS10" ? "Последний месяц" : code === "ASRS" ? "Последние 6 месяцев" : code === "MDQ" ? "За всю жизнь" : "Последние 2 недели";
  const answeredCount = draft ? Object.keys(draft.answers).length : 0;

  function start() {
    navigateToTestRun(code);
  }

  function resetDraft() {
    deleteDraft(code);
    setDraft(null);
    setConfirmingReset(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigateToView("tests")}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> К каталогу тестов
      </Button>
      <Card>
        <CardHeader>
          <CardTitle as="h1" className="text-2xl sm:text-3xl">{def.name}</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">{def.description}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <Clock3 aria-hidden="true" className="mb-2 h-4 w-4 text-primary" />
              <dt className="text-xs text-muted-foreground">Время</dt>
              <dd className="text-sm font-medium tabular-nums">Около {def.estimatedMinutes ?? 5} минут</dd>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <Users aria-hidden="true" className="mb-2 h-4 w-4 text-primary" />
              <dt className="text-xs text-muted-foreground">Кому подходит</dt>
              <dd className="text-sm font-medium">{def.ageGroup ?? "Уточните у специалиста"}</dd>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <RotateCcw aria-hidden="true" className="mb-2 h-4 w-4 text-primary" />
              <dt className="text-xs text-muted-foreground">Период вопросов</dt>
              <dd className="text-sm font-medium">{recallPeriod}</dd>
            </div>
          </dl>

          <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
            Ответы сохраняются только в этом браузере. Если закрыть страницу, незавершённое прохождение можно будет продолжить с последнего вопроса.
            {code === "MDQ" && " Для MDQ важны не только 13 симптомов: результат также учитывает, совпадали ли они по времени и насколько влияли на жизнь."}
          </div>

          <div className="rounded-xl bg-muted/50 p-4 text-sm">
            <h2 className="font-medium">Источник и версия</h2>
            <a href={def.sourceInfo.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              {def.sourceInfo.title}<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{def.sourceInfo.version}. {def.sourceInfo.translation}</p>
            {code === "PSS10" && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">У PSS-10 нет универсальных диагностических порогов: используйте сумму только как наблюдение, не как оценку нормы.</p>}
            {code === "WHO5" && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Порог сырого балла ниже 13 предложен WHO для дальнейшей оценки; он не подтверждает и не исключает диагноз.</p>}
          </div>

          {/* Состояние черновика известно только в браузере: до гидратации
              показываем нейтральный placeholder, чтобы кнопка не мигала
              «Начать тест» → «Продолжить прохождение». */}
          {!hydrated ? (
            <div aria-hidden="true" className="space-y-2">
              <div className="h-11 w-full animate-pulse rounded-xl bg-muted/70" />
              <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted/60" />
            </div>
          ) : (
            <div className="space-y-3">
              {draft ? (
                <p className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm leading-relaxed">
                  <span className="font-medium">Прохождение сохранено.</span>{" "}
                  Вы остановились на вопросе <span className="tabular-nums">{draft.current + 1}</span> из{" "}
                  <span className="tabular-nums">{def.questions.length}</span>, отвечено{" "}
                  <span className="tabular-nums">{answeredCount}</span>. Черновик обновлён{" "}
                  <span className="tabular-nums">{new Date(draft.updatedAt).toLocaleString("ru-RU")}</span>.
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={start} className="flex-1">
                  <Play aria-hidden="true" className="h-4 w-4" />
                  {draft ? "Продолжить прохождение" : "Начать тест"}
                </Button>
                {draft && !confirmingReset ? (
                  <Button variant="outline" onClick={() => setConfirmingReset(true)}>
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    Начать заново
                  </Button>
                ) : null}
              </div>

              {draft && confirmingReset ? (
                <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm">Удалить сохранённые ответы и начать с первого вопроса?</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={resetDraft}>Удалить черновик</Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingReset(false)}>Отмена</Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
