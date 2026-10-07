"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CalendarRange, Clock3, ExternalLink, ListChecks, LockKeyhole, Play, RotateCcw, Users } from "lucide-react";
import { getTest } from "@/data/tests";
import { deleteDraft, loadDraft, type TestDraft } from "@/lib/progress";
import { navigateToTestRun } from "@/lib/navigation";
import { formatRelativeDay, plural, summarizeResults, type TestSummary } from "@/lib/insights";
import { loadResultsByCode, severityColor } from "@/lib/results";
import { recallPeriod } from "@/lib/test-meta";
import { AppLink } from "@/components/app/app-link";
import { TestBadgeIcon } from "@/components/app/test-icon";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

const backLink =
  "inline-flex min-h-11 items-center gap-1.5 rounded-lg pr-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function TestIntroView({ code }: { code: string }) {
  const def = getTest(code);
  const [draft, setDraft] = useState<TestDraft | null>(null);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = new Date();
      setDraft(loadDraft(code));
      setSummary(summarizeResults(loadResultsByCode(code), current)[0] ?? null);
      setNow(current);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [code]);

  if (!def) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <AppLink path="/tests" className={backLink}><ArrowLeft aria-hidden="true" className="h-4 w-4" /> К каталогу тестов</AppLink>
        <h1 className="page-title">Тест не найден</h1>
        <p className="text-muted-foreground">Возможно, ссылка устарела. Выберите методику в каталоге.</p>
      </div>
    );
  }

  const answeredCount = draft ? Object.keys(draft.answers).length : 0;
  const questionCount = def.questions.length;

  async function resetDraft() {
    const accepted = await confirm({
      title: "Начать заново?",
      description: `Сохранённые ответы (${answeredCount} из ${questionCount}) будут удалены, прохождение начнётся с первого вопроса.`,
      confirmLabel: "Удалить черновик",
      destructive: true,
    });
    if (!accepted) return;
    deleteDraft(code);
    setDraft(null);
  }

  const facts = [
    { icon: ListChecks, term: "Объём", value: `${questionCount} ${plural(questionCount, ["вопрос", "вопроса", "вопросов"])}` },
    { icon: Clock3, term: "Время", value: `Около ${def.estimatedMinutes ?? 5} минут` },
    { icon: CalendarRange, term: "Период вопросов", value: recallPeriod(code) },
    { icon: Users, term: "Кому подходит", value: def.ageGroup ?? "Уточните у специалиста" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AppLink path="/tests" className={backLink}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> К каталогу тестов
      </AppLink>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <header className="space-y-4">
            <TestBadgeIcon code={def.code} size="lg" />
            <div>
              <h1 className="page-title">{def.name}</h1>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">{def.description}</p>
            </div>
          </header>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/80">
            {facts.map((fact) => (
              <div key={fact.term} className="bg-card p-4">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <fact.icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {fact.term}
                </dt>
                <dd className="mt-1 text-sm font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="how-heading" className="space-y-2">
            <h2 id="how-heading" className="font-semibold">Как проходить</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-border">
              <li>Отвечайте о том, как было на самом деле за указанный период, — правильных ответов нет.</li>
              <li>Можно вернуться к предыдущему вопросу и изменить ответ. На компьютере можно отвечать клавишами с цифрами.</li>
              <li>Если закрыть страницу, ответы сохранятся, и можно будет продолжить с того же места.</li>
              {code === "MDQ" ? (
                <li>Для MDQ важны не только 13 симптомов: результат также учитывает, совпадали ли они по времени и насколько влияли на жизнь.</li>
              ) : null}
            </ul>
          </section>

          <section aria-labelledby="source-heading" className="rounded-2xl border border-border/70 bg-surface p-4 text-sm sm:p-5">
            <h2 id="source-heading" className="font-semibold">Источник и версия</h2>
            <a
              href={def.sourceInfo.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-primary underline underline-offset-4"
            >
              {def.sourceInfo.title}
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="sr-only">(откроется в новой вкладке)</span>
            </a>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{def.sourceInfo.version}. {def.sourceInfo.translation}</p>
            {code === "PSS10" && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">У PSS-10 нет универсальных диагностических порогов: используйте сумму только как наблюдение, не как оценку нормы.</p>}
            {code === "WHO5" && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Порог сырого балла ниже 13 предложен WHO для дальнейшей оценки; он не подтверждает и не исключает диагноз.</p>}
          </section>
        </div>

        <aside aria-label="Прохождение" className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
            {/* Черновик известен только в браузере: до гидратации — нейтральный placeholder,
                чтобы кнопка не мигала «Начать тест» → «Продолжить прохождение». */}
            {!hydrated ? (
              <div aria-hidden="true" className="space-y-3">
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted/60" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-muted/70" />
              </div>
            ) : (
              <div className="space-y-4">
                {draft ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Прохождение сохранено</p>
                    <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(answeredCount / questionCount) * 100}%` }} />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Вы остановились на вопросе <span className="tabular-nums">{draft.current + 1}</span> из{" "}
                      <span className="tabular-nums">{questionCount}</span>, отвечено{" "}
                      <span className="tabular-nums">{answeredCount}</span>. Черновик обновлён{" "}
                      {now ? formatRelativeDay(draft.updatedAt, now) : ""}.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {questionCount} {plural(questionCount, ["вопрос", "вопроса", "вопросов"])}, около {def.estimatedMinutes ?? 5} минут. Можно прерваться в любой момент.
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button size="lg" onClick={() => navigateToTestRun(code)} className="w-full">
                    <Play aria-hidden="true" className="h-4 w-4" />
                    {draft ? "Продолжить прохождение" : "Начать тест"}
                  </Button>
                  {draft ? (
                    <Button variant="outline" onClick={resetDraft} className="w-full">
                      <RotateCcw aria-hidden="true" className="h-4 w-4" />
                      Начать заново
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
            <p className="mt-4 flex items-start gap-2 border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
              <LockKeyhole aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Ответы сохраняются только в этом браузере и никуда не отправляются.
            </p>
          </div>

          {hydrated && summary?.latestComplete && now ? (
            <AppLink
              path={`/results?open=${encodeURIComponent(summary.latestComplete.id)}`}
              className="block rounded-2xl border border-border/70 bg-surface p-4 text-sm transition hover:border-primary/40"
            >
              <span className="text-xs text-muted-foreground">Прошлый результат · {formatRelativeDay(summary.latestComplete.dateISO, now)}</span>
              <span className="mt-1 flex items-start gap-2 font-medium">
                <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: severityColor(summary.latestComplete.severity) }} />
                <span>
                  <span className="tabular-nums">{summary.latestComplete.totalScore} из {summary.latestComplete.maxScore}</span> · {summary.latestComplete.label}
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {summary.count} {plural(summary.count, ["запись", "записи", "записей"])} в истории · {def.periodicity}
              </span>
            </AppLink>
          ) : null}
        </aside>
      </div>
      {confirmDialog}
    </div>
  );
}
