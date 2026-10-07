"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Clock3, ListChecks, Play, RotateCcw } from "lucide-react";
import { getTest, type TestDefinition } from "@/data/tests";
import { getResultCompleteness, loadResults, severityColor } from "@/lib/results";
import { loadDraft, type TestDraft } from "@/lib/progress";
import { formatRelativeDay, plural, summarizeResults, type TestSummary } from "@/lib/insights";
import { testPath, testRunPath } from "@/lib/routes";
import { subscribeStorage } from "@/lib/storage/storage";
import { TEST_GROUPS, recallPeriod } from "@/lib/test-meta";
import { AppLink } from "@/components/app/app-link";
import { PageHeader, SectionHeading } from "@/components/app/page-header";
import { TestBadgeIcon } from "@/components/app/test-icon";
import { Sparkline } from "@/components/app/trend-chart";
import { Button } from "@/components/ui/button";

interface CatalogState {
  now: Date;
  summaries: Map<string, TestSummary>;
  drafts: Map<string, TestDraft>;
}

function readCatalog(): CatalogState {
  const now = new Date();
  const summaries = new Map(summarizeResults(loadResults(), now).map((summary) => [summary.def.code, summary]));
  const drafts = new Map<string, TestDraft>();
  for (const group of TEST_GROUPS) {
    for (const code of group.codes) {
      const draft = loadDraft(code);
      if (draft) drafts.set(code, draft);
    }
  }
  return { now, summaries, drafts };
}

export function TestsView() {
  const [state, setState] = useState<CatalogState | null>(null);

  useEffect(() => {
    const refresh = () => setState(readCatalog());
    const timer = window.setTimeout(refresh, 0);
    const unsubscribe = subscribeStorage(refresh);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Опросники"
        title="Каталог тестов"
        description={
          <>
            <p>Короткие проверенные формы помогают замечать изменения и собирать вопросы к специалисту. Начните с одной — ответы останутся на этом устройстве.</p>
            <p className="mt-2 text-sm">Это не диагноз, не оценка риска и не замена консультации.</p>
          </>
        }
      />

      {TEST_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`group-${group.id}`} className="space-y-4">
          <SectionHeading id={`group-${group.id}`} title={group.title} description={group.description} />
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.codes.map((code) => {
              const def = getTest(code);
              if (!def) return null;
              return (
                <li key={code} className="min-w-0">
                  <TestCard def={def} state={state} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <aside className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Не уверены, что выбрать?</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Назначение, источники и ограничения каждой методики собраны на одной странице.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <AppLink path="/about">О методиках и ограничениях</AppLink>
        </Button>
      </aside>
    </div>
  );
}

function TestCard({ def, state }: { def: TestDefinition; state: CatalogState | null }) {
  const summary = state?.summaries.get(def.code);
  const draft = state?.drafts.get(def.code);
  const answered = draft ? Object.keys(draft.answers).length : 0;
  const titleId = `test-${def.code}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-card transition-colors focus-within:border-primary/40 hover:border-primary/30"
    >
      <div className="flex items-start gap-3">
        <TestBadgeIcon code={def.code} />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="font-semibold leading-snug">
            <AppLink path={testPath(def.code)} className="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              {def.name}
            </AppLink>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{recallPeriod(def.code)}</p>
        </div>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{def.description}</p>

      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Объём</dt>
          <ListChecks aria-hidden="true" className="h-3.5 w-3.5" />
          <dd className="tabular-nums">
            {def.questions.length} {plural(def.questions.length, ["вопрос", "вопроса", "вопросов"])}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Время</dt>
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
          <dd className="tabular-nums">около {def.estimatedMinutes ?? 5} мин</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Периодичность</dt>
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          <dd>{def.periodicity}</dd>
        </div>
      </dl>

      <div className="mt-auto space-y-3 border-t border-border/60 pt-4">
        <CardStatus summary={summary} draft={draft} def={def} state={state} answered={answered} />
        <Button asChild size="sm" variant={draft ? "default" : summary ? "outline" : "default"} className="w-full">
          <AppLink path={draft ? testRunPath(def.code) : testPath(def.code)} aria-describedby={titleId}>
            {draft ? (
              <>
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                Продолжить · {answered} из {def.questions.length}
              </>
            ) : summary ? (
              <>
                Пройти снова
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <Play aria-hidden="true" className="h-3.5 w-3.5" />
                Пройти
              </>
            )}
          </AppLink>
        </Button>
      </div>
    </article>
  );
}

function CardStatus({
  summary,
  draft,
  def,
  state,
  answered,
}: {
  summary?: TestSummary;
  draft?: TestDraft;
  def: TestDefinition;
  state: CatalogState | null;
  answered: number;
}) {
  if (!state) return <div aria-hidden="true" className="h-9 animate-pulse rounded-lg bg-muted/60" />;

  if (draft) {
    return (
      <div className="space-y-1.5">
        <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${(answered / def.questions.length) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">Черновик сохранён {formatRelativeDay(draft.updatedAt, state.now)}</p>
      </div>
    );
  }

  if (!summary) return <p className="text-xs text-muted-foreground">Ещё не проходили</p>;

  const latest = summary.latest;
  const complete = summary.latestComplete;
  const latestIncomplete = getResultCompleteness(latest) !== "complete";

  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0 space-y-0.5 text-xs">
        {complete ? (
          <p className="flex items-start gap-1.5 font-medium">
            <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: severityColor(complete.severity) }} />
            <span className="min-w-0">
              <span className="tabular-nums">{complete.totalScore} из {complete.maxScore}</span> · {complete.label}
            </span>
          </p>
        ) : null}
        <p className="text-muted-foreground">
          {latestIncomplete
            ? `Последняя попытка неполная · ${formatRelativeDay(latest.dateISO, state.now)}`
            : `Последний раз ${formatRelativeDay(latest.dateISO, state.now)}`}
          {summary.dueForRepeat ? " · можно повторить" : ""}
        </p>
      </div>
      <Sparkline
        values={summary.completeSeries.slice(-8).map((result) => result.totalScore as number)}
        max={complete?.maxScore ?? 1}
        className="h-7 w-16 shrink-0 text-primary"
      />
    </div>
  );
}
