"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookHeart,
  CalendarDays,
  ClipboardPenLine,
  LifeBuoy,
  LockKeyhole,
  RotateCcw,
} from "lucide-react";
import { ALL_TESTS, getTest, type TestDefinition } from "@/data/tests";
import { AppLink } from "@/components/app/app-link";
import { PageHeader, SectionHeading } from "@/components/app/page-header";
import { TestBadgeIcon } from "@/components/app/test-icon";
import { Sparkline } from "@/components/app/trend-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  loadDiaryDraft,
  loadDiaryEntries,
  loadVisitPrep,
  loadVisitPrepDraft,
  type DiaryEntry,
  type VisitPrep,
} from "@/lib/clinical-notes";
import { describeDelta, formatRelativeDay, plural, summarizeResults, unitForms, type TestSummary } from "@/lib/insights";
import { loadDraft, type TestDraft } from "@/lib/progress";
import { getResultCompleteness, loadResults, severityColor } from "@/lib/results";
import { testPath, testRunPath } from "@/lib/routes";
import { subscribeStorage } from "@/lib/storage/storage";
import { STARTER_CODES } from "@/lib/test-meta";
import { cn } from "@/lib/utils";

const VISIT_SECTIONS: (keyof VisitPrep)[] = [
  "priority",
  "changes",
  "episodes",
  "sleep",
  "moodActivity",
  "currentMedication",
  "previousMedication",
  "health",
  "familyHistory",
  "substances",
  "safety",
  "other",
  "questions",
];

interface Snapshot {
  now: Date;
  summaries: TestSummary[];
  drafts: { def: TestDefinition; draft: TestDraft }[];
  diary: DiaryEntry[];
  diaryDraft: boolean;
  visit: VisitPrep;
  visitDraft: boolean;
}

function readSnapshot(): Snapshot {
  const now = new Date();
  const drafts = ALL_TESTS.flatMap((def) => {
    const draft = loadDraft(def.code);
    return draft ? [{ def, draft }] : [];
  }).sort((a, b) => b.draft.updatedAt.localeCompare(a.draft.updatedAt));
  return {
    now,
    summaries: summarizeResults(loadResults(), now),
    drafts,
    diary: loadDiaryEntries(),
    diaryDraft: Boolean(loadDiaryDraft()),
    visit: loadVisitPrep(),
    visitDraft: Boolean(loadVisitPrepDraft()),
  };
}

function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const linkCard =
  "group block rounded-2xl border border-border/80 bg-card p-4 shadow-card transition hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-5";

export function HomeView() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    const refresh = () => setSnapshot(readSnapshot());
    const timer = window.setTimeout(refresh, 0);
    const unsubscribe = subscribeStorage(refresh);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const firstRun =
    snapshot !== null &&
    snapshot.summaries.length === 0 &&
    snapshot.drafts.length === 0 &&
    snapshot.diary.length === 0 &&
    !snapshot.diaryDraft &&
    !snapshot.visitDraft &&
    !snapshot.visit.updatedAt;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={
          snapshot
            ? snapshot.now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })
            : "Главная"
        }
        title="Как вы сегодня?"
        description={
          firstRun
            ? "MindTrack помогает спокойно наблюдать за состоянием: короткие проверенные опросники, дневник и сводка к приёму. Всё хранится только в этом браузере."
            : "Здесь собрано то, к чему стоит вернуться: незавершённые ответы, последние результаты и записи."
        }
      />

      {snapshot === null ? (
        <HomeSkeleton />
      ) : firstRun ? (
        <FirstRun />
      ) : (
        <Overview snapshot={snapshot} />
      )}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-36 animate-pulse rounded-2xl bg-muted/60" />
      ))}
    </div>
  );
}

function FirstRun() {
  const starters = STARTER_CODES.map((code) => getTest(code)).filter((def): def is TestDefinition => Boolean(def));
  const steps = [
    { title: "Пройдите короткий опросник", text: "3–5 минут. Результат покажет, где вы на шкале методики, без диагнозов." },
    { title: "Отмечайте состояние", text: "Пара отметок в дневнике в день помогает увидеть закономерности." },
    { title: "Подготовьтесь к приёму", text: "Соберите важное в одну сводку и возьмите её к врачу." },
  ];

  return (
    <div className="space-y-10">
      <section aria-labelledby="start-heading" className="space-y-4">
        <SectionHeading id="start-heading" title="С чего начать" description="Обычно начинают с общего самочувствия — это займёт пару минут." />
        <div className="grid gap-3 md:grid-cols-3">
          {starters.map((def) => (
            <AppLink key={def.code} path={testPath(def.code)} className={cn(linkCard, "flex flex-col gap-4")}>
              <div className="flex items-start justify-between gap-3">
                <TestBadgeIcon code={def.code} />
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold leading-snug">{def.name}</p>
                <p className="text-sm text-muted-foreground">
                  {def.questions.length} {plural(def.questions.length, ["вопрос", "вопроса", "вопросов"])} · около {def.estimatedMinutes ?? 5} мин
                </p>
              </div>
            </AppLink>
          ))}
        </div>
        <AppLink path="/tests" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-primary underline-offset-4 hover:underline">
          Все {ALL_TESTS.length} методик <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </AppLink>
      </section>

      <section aria-labelledby="how-heading" className="space-y-4">
        <SectionHeading id="how-heading" title="Как это работает" />
        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border/70 bg-surface p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-sm font-semibold tabular-nums text-primary shadow-card">
                {index + 1}
              </span>
              <p className="mt-4 font-semibold">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <PrivacyNote />
    </div>
  );
}

function PrivacyNote() {
  return (
    <aside className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <LockKeyhole aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium">Данные остаются у вас</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            Без аккаунта, аналитики и отправки ответов. Удалить всё можно в один шаг.
          </p>
        </div>
      </div>
      <AppLink path="/privacy" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
        О приватности
      </AppLink>
    </aside>
  );
}

function Overview({ snapshot }: { snapshot: Snapshot }) {
  const { now, summaries, drafts } = snapshot;
  const due = summaries.filter((summary) => summary.dueForRepeat);
  const taken = new Set(summaries.map((summary) => summary.def.code));
  const notTaken = STARTER_CODES.filter((code) => !taken.has(code))
    .map((code) => getTest(code))
    .filter((def): def is TestDefinition => Boolean(def));

  return (
    <div className="space-y-10">
      {drafts.length > 0 ? (
        <section aria-labelledby="continue-heading" className="space-y-4">
          <SectionHeading id="continue-heading" title="Продолжить" description="Ответы сохранены — можно вернуться к тому же вопросу." />
          <div className="grid gap-3 sm:grid-cols-2">
            {drafts.map(({ def, draft }) => {
              const answered = Object.keys(draft.answers).length;
              const total = def.questions.length;
              return (
                <AppLink key={def.code} path={testRunPath(def.code)} className={cn(linkCard, "flex items-center gap-4")}>
                  <TestBadgeIcon code={def.code} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="truncate font-semibold">{def.name}</p>
                    <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(answered / total) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Отвечено {answered} из {total} · {formatRelativeDay(draft.updatedAt, now)}
                    </p>
                  </div>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </AppLink>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <section aria-labelledby="latest-heading" className="min-w-0 space-y-4">
          <SectionHeading
            id="latest-heading"
            title="Последние результаты"
            action={
              summaries.length > 0 ? (
                <AppLink path="/results" className="inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-medium text-primary underline-offset-4 hover:underline">
                  Вся история <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </AppLink>
              ) : null
            }
          />
          {summaries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-6 text-sm leading-relaxed text-muted-foreground">
              Здесь появятся результаты опросников и их динамика.{" "}
              <AppLink path="/tests" className="font-medium text-primary underline underline-offset-4">Выбрать тест</AppLink>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {summaries.map((summary) => (
                <li key={summary.def.code}>
                  <ResultTile summary={summary} now={now} />
                </li>
              ))}
            </ul>
          )}

          {due.length > 0 || notTaken.length > 0 ? (
            <div className="rounded-2xl border border-border/70 bg-surface p-4 sm:p-5">
              <p className="text-sm font-medium">Можно пройти, когда будет удобно</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Подсказка по рекомендуемой периодичности методик — не обязательство.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {due.map(({ def }) => (
                  <AppLink key={def.code} path={testPath(def.code)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-sm font-medium transition hover:border-primary/40">
                    <RotateCcw aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                    {def.short}
                    <span className="sr-only">: прошло больше рекомендуемого интервала ({def.periodicity})</span>
                  </AppLink>
                ))}
                {notTaken.map((def) => (
                  <AppLink key={def.code} path={testPath(def.code)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-border bg-card px-3 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                    {def.short}
                    <span className="text-xs font-normal">· ещё не проходили</span>
                  </AppLink>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <div className="space-y-4">
          <DiaryCard snapshot={snapshot} />
          <VisitCard snapshot={snapshot} />
          <AppLink
            path="/help"
            className="flex min-h-11 items-center gap-3 rounded-2xl border border-attention/25 bg-attention-surface px-4 py-3 text-sm text-attention-foreground transition hover:border-attention/50"
          >
            <LifeBuoy aria-hidden="true" className="h-5 w-5 shrink-0" />
            <span className="flex-1">Если сейчас тяжело — куда обратиться</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          </AppLink>
        </div>
      </div>
    </div>
  );
}

function ResultTile({ summary, now }: { summary: TestSummary; now: Date }) {
  const { def, latest, latestComplete, previousComplete, completeSeries } = summary;
  const latestIsComplete = getResultCompleteness(latest) === "complete" && latest.totalScore !== null;
  // Балл и категорию показываем только по полному результату; неполная попытка лишь упоминается.
  const shown = latestComplete;
  const delta = shown ? describeDelta(shown.totalScore, previousComplete?.totalScore ?? null, unitForms(def)) : null;
  const color = shown ? severityColor(shown.severity) : "var(--sev-neutral)";

  return (
    <AppLink path={`/results?open=${encodeURIComponent(latest.id)}`} className={cn(linkCard, "flex h-full flex-col gap-3")}>
      <div className="flex items-center gap-3">
        <TestBadgeIcon code={def.code} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{def.short}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeDay(latest.dateISO, now)}</p>
        </div>
        {summary.dueForRepeat ? <Badge variant="outline" className="shrink-0">можно повторить</Badge> : null}
      </div>
      {!latestIsComplete ? (
        <p className="text-xs text-muted-foreground">
          Последняя попытка неполная · {Object.keys(latest.answers).length} из {def.questions.length} ответов
        </p>
      ) : null}
      {shown ? (
        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums tracking-tight">{shown.totalScore}</span>
              <span className="text-sm tabular-nums text-muted-foreground">из {shown.maxScore}</span>
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-xs">
              <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="line-clamp-2">{shown.label}</span>
            </p>
            {delta && previousComplete && delta !== "без изменений" ? (
              <p className="mt-1 text-xs text-muted-foreground">{delta}, чем в прошлый раз</p>
            ) : null}
          </div>
          <Sparkline
            values={completeSeries.slice(-8).map((result) => result.totalScore as number)}
            max={shown.maxScore}
            className="shrink-0 text-primary"
          />
        </div>
      ) : null}
    </AppLink>
  );
}

function DiaryCard({ snapshot }: { snapshot: Snapshot }) {
  const { diary, diaryDraft, now } = snapshot;
  const today = diary.find((entry) => entry.date === localDateKey(now));
  const recent = diary.slice(0, 14).reverse();

  return (
    <section aria-labelledby="diary-card-heading" className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <BookHeart aria-hidden="true" className="h-4 w-4" />
        </span>
        <h2 id="diary-card-heading" className="font-semibold">Дневник</h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {today
          ? `Запись за сегодня есть: настроение ${today.mood}/10.`
          : diaryDraft
            ? "Есть несохранённый черновик записи."
            : diary.length > 0
              ? `Последняя запись — ${formatRelativeDay(`${diary[0].date}T12:00:00`, now)}.`
              : "Пока нет записей. Отметка занимает около минуты."}
      </p>
      {recent.length >= 2 ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Настроение, {recent.length} {plural(recent.length, ["запись", "записи", "записей"])}
          </span>
          <Sparkline values={recent.map((entry) => entry.mood)} max={10} className="h-6 w-24 text-primary" />
        </div>
      ) : null}
      <Button asChild variant={today ? "outline" : "default"} className="mt-4 w-full">
        <AppLink path="/diary">{today ? "Открыть дневник" : diaryDraft ? "Продолжить запись" : "Отметить состояние"}</AppLink>
      </Button>
    </section>
  );
}

function VisitCard({ snapshot }: { snapshot: Snapshot }) {
  const { visit, visitDraft, now } = snapshot;
  const filled = VISIT_SECTIONS.filter((key) => visit[key].trim() !== "").length;
  const visitDate = visit.visitDate ? new Date(`${visit.visitDate}T12:00:00`) : null;
  const validDate = visitDate && !Number.isNaN(visitDate.getTime()) ? visitDate : null;

  return (
    <section aria-labelledby="visit-card-heading" className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <ClipboardPenLine aria-hidden="true" className="h-4 w-4" />
        </span>
        <h2 id="visit-card-heading" className="font-semibold">Подготовка к приёму</h2>
      </div>
      {validDate ? (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <CalendarDays aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          Приём {validDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {visit.updatedAt
          ? `Сводка сохранена ${formatRelativeDay(visit.updatedAt, now)}: заполнено ${filled} из ${VISIT_SECTIONS.length} разделов.`
          : visitDraft
            ? "Есть несохранённый черновик сводки."
            : "Соберите жалобы, изменения и вопросы, чтобы ничего не забыть на приёме."}
      </p>
      {visit.updatedAt ? (
        <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${(filled / VISIT_SECTIONS.length) * 100}%` }} />
        </div>
      ) : null}
      <Button asChild variant="outline" className="mt-4 w-full">
        <AppLink path="/visit">{visit.updatedAt || visitDraft ? "Открыть сводку" : "Начать подготовку"}</AppLink>
      </Button>
    </section>
  );
}
