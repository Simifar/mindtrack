"use client";
import { useEffect, useState } from "react";
import {
  ALL_TESTS,
  type TestDefinition,
} from "@/data/tests";
import { getResultCompleteness, loadResultsByCode, severityColor } from "@/lib/results";
import { navigateToTest } from "@/lib/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  ClipboardList,
  CloudRain,
  HeartPulse,
  MoonStar,
  Play,
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
  const Icon = TEST_ICONS[code] ?? Clipboard;
  return <Icon className={className} />;
}

function Clipboard(props: { className?: string }) {
  return <ClipboardList aria-hidden="true" className={props.className} />;
}

export function TestsView() {
  const [lastByCode, setLastByCode] = useState<Map<string, { label: string; severity: string; dateISO: string; score: number | null; max: number; complete: boolean; answered: number }>>(new Map());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const map = new Map<string, { label: string; severity: string; dateISO: string; score: number | null; max: number; complete: boolean; answered: number }>();
      for (const t of ALL_TESTS) {
        const last = loadResultsByCode(t.code)[0];
        if (last) {
          const complete = getResultCompleteness(last) === "complete";
          map.set(t.code, {
            label: last.label,
            severity: last.severity,
            dateISO: last.dateISO,
            score: complete ? last.totalScore : null,
            max: last.maxScore,
            complete,
            answered: Object.keys(last.answers).length,
          });
        }
      }
      setLastByCode(map);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-card px-5 py-7 shadow-sm sm:px-8 sm:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative max-w-2xl">
          <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Только в этом браузере
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Каталог тестов</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Короткие опросники помогают замечать изменения и собирать вопросы к специалисту. Начните с одного — ответы останутся на этом устройстве.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Это не диагноз, не оценка риска и не замена консультации.</p>
        </div>
      </section>

      <section aria-labelledby="tests-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="tests-heading" className="text-xl font-semibold tracking-tight">Выберите опросник</h2>
            <p className="mt-1 text-sm text-muted-foreground">Сначала посмотрите период вопросов и кому подходит форма.</p>
          </div>
          <span className="text-xs text-muted-foreground">{ALL_TESTS.length} методик</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ALL_TESTS.map((t) => (
            <TestCard key={t.code} def={t} onOpen={() => navigateToTest(t.code)} last={lastByCode.get(t.code)} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="font-semibold">Не уверены, с чего начать?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ознакомьтесь с источниками, назначением и ограничениями каждой методики.</p>
        </div>
        <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/about`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
          Об источниках и ограничениях
        </a>
      </section>
    </div>
  );
}

function TestCard({
  def,
  onOpen,
  last,
}: {
  def: TestDefinition;
  onOpen: () => void;
  last?: { label: string; severity: string; dateISO: string; score: number | null; max: number; complete: boolean; answered: number };
}) {
  const color = last ? last.complete ? severityColor(last.severity) : "var(--muted-foreground)" : undefined;
  return (
    <Card className="group flex h-full flex-col justify-between gap-4 border-border/70 bg-card p-4 shadow-none transition-all hover:border-primary/35 hover:shadow-md sm:p-5">
      <CardHeader className="flex-row items-start gap-3 space-y-0 p-0">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-0"
          style={{
            backgroundColor: `color-mix(in oklab, ${color ?? "var(--primary)"} 11%, var(--card))`,
            color: color ?? "var(--primary)",
          }}
        >
          <TestIcon code={def.code} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-[0.98rem] leading-snug">{def.name}</CardTitle>
          <CardDescription className="mt-2 line-clamp-3 leading-5">{def.description}</CardDescription>
        </div>
      </CardHeader>

      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{def.questions.length} вопросов</span>
          <span aria-hidden className="text-border">·</span>
          <span>около {def.estimatedMinutes ?? 5} мин</span>
          <span aria-hidden className="text-border">·</span>
          <span>{def.periodicity}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          {last ? (
            <div className="min-w-0 space-y-1">
              <Badge
                variant="outline"
                className="max-w-full truncate"
                style={{ borderColor: color, color }}
              >
                {last.complete && last.score !== null ? `${last.score} / ${last.max} · ${last.label}` : `Неполный · ${last.answered} ответов`}
              </Badge>
              <p className="text-[11px] text-muted-foreground">
                {new Date(last.dateISO).toLocaleDateString("ru-RU")}
              </p>
            </div>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              ещё не проходили
            </Badge>
          )}
          <Button size="sm" onClick={onOpen} className="min-h-10 shrink-0 px-4">
            <Play className="h-3.5 w-3.5" />
            Пройти
          </Button>
        </div>
      </div>
    </Card>
  );
}
