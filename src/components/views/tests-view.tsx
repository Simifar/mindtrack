"use client";
import { useEffect, useState } from "react";
import {
  ALL_TESTS,
  type TestDefinition,
} from "@/data/tests";
import { getResultCompleteness, loadResultsByCode, severityColor, type SavedResult } from "@/lib/results";
import { loadDraft } from "@/lib/progress";
import { navigateToTest } from "@/lib/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  ClipboardList,
  Clock3,
  CloudRain,
  HeartPulse,
  Info,
  MoonStar,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";

const TEST_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PHQ9: CloudRain,
  GAD7: Zap,
  MDQ: HeartPulse,
  ASRS: Timer,
  PSS10: Brain,
  ISI: MoonStar,
  WHO5: Sparkles,
};

function TestIcon({ code, className }: { code: string; className?: string }) {
  const Icon = TEST_ICONS[code] ?? ClipboardList;
  return <Icon aria-hidden="true" className={className} />;
}

type CatalogEntry = {
  results: SavedResult[];
  hasDraft: boolean;
};

/**
 * Динамика по методике: последние значения и минимальный график.
 * Точки идут от старых к новым; числовая подпись остаётся основным носителем смысла.
 */
function ScoreHistory({ values, max, color }: { values: number[]; max: number; color: string }) {
  // Одно значение не образует динамику: сам балл уже показан строкой выше.
  if (values.length < 2) return null;
  const width = 68;
  const height = 20;
  const pad = 2;
  const coordinates = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (values.length - 1);
    const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
    return { x, y: height - pad - ratio * (height - pad * 2) };
  });
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const last = coordinates[coordinates.length - 1];

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {values.join(" → ")}
      </span>
      {values.length > 1 ? (
        <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} className="h-5 w-[68px] shrink-0">
          <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
          <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
        </svg>
      ) : null}
    </div>
  );
}

export function TestsView() {
  const [catalog, setCatalog] = useState<Map<string, CatalogEntry>>(new Map());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const map = new Map<string, CatalogEntry>();
      for (const test of ALL_TESTS) {
        map.set(test.code, {
          results: loadResultsByCode(test.code).slice(0, 5),
          hasDraft: Boolean(loadDraft(test.code)),
        });
      }
      setCatalog(map);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Каталог тестов</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Короткие опросники помогают замечать изменения и собирать вопросы к специалисту. Начните с одного — ответы останутся на этом устройстве.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Это не диагноз, не оценка риска и не замена консультации. Все результаты хранятся только в этом браузере.
        </p>
      </header>

      <section aria-labelledby="tests-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="tests-heading" className="text-lg font-semibold tracking-tight">Выберите опросник</h2>
          <span className="text-xs tabular-nums text-muted-foreground">{ALL_TESTS.length} методик</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ALL_TESTS.map((test) => (
            <TestCard
              key={test.code}
              def={test}
              entry={catalog.get(test.code)}
              hydrated={hydrated}
              onOpen={() => navigateToTest(test.code)}
            />
          ))}
          <Card className="flex h-full flex-col justify-between gap-4 border-border/60 bg-muted/40 p-5 shadow-none">
            <div className="space-y-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background text-muted-foreground">
                <Info aria-hidden="true" className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">Не уверены, с чего начать?</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Посмотрите назначение, источники и ограничения каждой методики — это поможет выбрать форму и понять, что означает результат.
              </p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/about`}
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              О методиках и ограничениях
            </a>
          </Card>
        </div>
      </section>
    </div>
  );
}

function TestCard({
  def,
  entry,
  hydrated,
  onOpen,
}: {
  def: TestDefinition;
  entry?: CatalogEntry;
  hydrated: boolean;
  onOpen: () => void;
}) {
  const last = entry?.results[0];
  const completeValues = entry?.results
    .filter((result) => getResultCompleteness(result) === "complete" && result.totalScore !== null)
    .slice(0, 5)
    .map((result) => result.totalScore as number)
    .reverse() ?? [];
  const color = last ? (getResultCompleteness(last) === "complete" ? severityColor(last.severity) : "var(--sev-neutral)") : "var(--primary)";

  return (
    <Card className="flex h-full flex-col gap-4 border-border/70 bg-card p-5 shadow-none transition-colors hover:border-primary/35 focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-ring/40">
      <CardHeader className="flex-row items-start gap-3 space-y-0 p-0">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `color-mix(in oklab, ${color} 12%, var(--card))`,
            color,
          }}
        >
          <TestIcon code={def.code} className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-2">
          <CardTitle className="text-base">{def.name}</CardTitle>
          <CardDescription className="leading-6">{def.description}</CardDescription>
        </div>
      </CardHeader>

      <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ClipboardList aria-hidden="true" className="h-3.5 w-3.5" />
          <dt className="sr-only">Объём</dt>
          <dd className="tabular-nums">{def.questions.length} вопросов</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
          <dt className="sr-only">Время</dt>
          <dd className="tabular-nums">около {def.estimatedMinutes ?? 5} мин</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          <dt className="sr-only">Периодичность</dt>
          <dd>{def.periodicity}</dd>
        </div>
        {def.ageGroup ? (
          <div className="w-full">
            <dt className="sr-only">Кому подходит</dt>
            <dd>{def.ageGroup}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3">
        <div className="min-w-0 space-y-1">
          {!hydrated ? (
            <div aria-hidden="true" className="h-5 w-40 animate-pulse rounded-md bg-muted/70" />
          ) : last ? (
            <>
              <p className="truncate text-xs font-medium" style={{ color }}>
                {getResultCompleteness(last) === "complete"
                  ? `${last.totalScore} из ${last.maxScore} · ${last.label}`
                  : `Неполный результат · ${Object.keys(last.answers).length} ответов`}
              </p>
              <p className="text-[11px] tabular-nums text-muted-foreground">
                {new Date(last.dateISO).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
              <ScoreHistory values={completeValues} max={last.maxScore} color={color} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Ещё не проходили</p>
          )}
        </div>
        <Button size="sm" onClick={onOpen} className="shrink-0 px-4">
          {hydrated && entry?.hasDraft ? (
            <>
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              Продолжить
            </>
          ) : (
            <>
              <Play aria-hidden="true" className="h-3.5 w-3.5" />
              Пройти
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
