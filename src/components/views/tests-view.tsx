"use client";
import { useEffect, useState } from "react";
import {
  ALL_TESTS,
  maxScore,
  type TestDefinition,
} from "@/data/tests";
import { loadResultsByCode, severityColor } from "@/lib/results";
import { navigateToTest } from "@/lib/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
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
  return <span className={props.className}>📋</span>;
}

export function TestsView() {
  const [lastByCode, setLastByCode] = useState<Map<string, { label: string; severity: string; dateISO: string; score: number; max: number }>>(new Map());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const map = new Map<string, { label: string; severity: string; dateISO: string; score: number; max: number }>();
      for (const t of ALL_TESTS) {
        const last = loadResultsByCode(t.code)[0];
        if (last) {
          map.set(t.code, {
            label: last.label,
            severity: last.severity,
            dateISO: last.dateISO,
            score: last.totalScore,
            max: last.maxScore,
          });
        }
      }
      setLastByCode(map);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Каталог тестов</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Скрининговые опросники самонаблюдения. Без регистрации — результаты хранятся только в вашем
          браузере. Это не диагноз.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ALL_TESTS.map((t) => (
          <TestCard key={t.code} def={t} onOpen={() => navigateToTest(t.code)} last={lastByCode.get(t.code)} />
        ))}
      </div>
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
  last?: { label: string; severity: string; dateISO: string; score: number; max: number };
}) {
  const color = last ? severityColor(last.severity) : undefined;
  return (
    <Card className="group flex h-full flex-col justify-between gap-4 py-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="flex-row items-start gap-3 space-y-0 px-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
          style={{
            backgroundColor: `color-mix(in srgb, ${color ?? "var(--primary)"} 12%, transparent)`,
            color: color ?? "var(--primary)",
            borderColor: color ? `color-mix(in srgb, ${color} 30%, transparent)` : undefined,
          }}
        >
          <TestIcon code={def.code} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base leading-snug">{def.name}</CardTitle>
          <CardDescription className="mt-1 line-clamp-2">{def.description}</CardDescription>
        </div>
      </CardHeader>

      <div className="px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{def.questions.length} вопросов</span>
          <span aria-hidden>·</span>
          <span>макс. {maxScore(def)}</span>
          <span aria-hidden>·</span>
          <span>{def.periodicity}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {last ? (
            <div className="min-w-0 space-y-1">
              <Badge
                variant="outline"
                className="max-w-full truncate"
                style={{ borderColor: color, color }}
              >
                {last.score} / {last.max} · {last.label}
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
          <Button size="sm" onClick={onOpen} className="shrink-0">
            <Play className="h-3.5 w-3.5" />
            Пройти
          </Button>
        </div>
      </div>
    </Card>
  );
}
