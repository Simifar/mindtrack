"use client";
import { useState } from "react";
import { getTest, scoreTest, maxScore } from "@/data/tests";
import { saveResult } from "@/lib/results";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type Answers = Record<number, number>;

export function TestRunnerView() {
  const code = useAppStore((s) => s.activeTestCode);
  const setView = useAppStore((s) => s.setView);
  const setCrisisOpen = useAppStore((s) => s.setCrisisOpen);

  const def = code ? getTest(code) : undefined;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  if (!def) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => setView("tests")}>
          <ArrowLeft className="h-4 w-4" /> К списку тестов
        </Button>
        <p className="mt-4 text-muted-foreground">Тест не найден.</p>
      </div>
    );
  }

  const total = def.questions.length;
  const value = answers[current];
  const isLast = current === total - 1;
  const progress = ((current + 1) / total) * 100;

  function finish() {
    if (!def) return;
    const r = scoreTest(def, answers);
    const date = new Date();
    saveResult({
      code: def.code,
      testName: def.name,
      dateISO: date.toISOString(),
      totalScore: r.totalScore,
      maxScore: maxScore(def),
      severity: r.severity,
      label: r.label,
      advice: r.advice,
      crisisDetected: r.crisisDetected,
      answers: { ...answers },
    });
    if (r.crisisDetected) setCrisisOpen(true);
    setView("results");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => setView("tests")}>
          <ArrowLeft className="h-4 w-4" />
          Выйти
        </Button>
        <span className="text-sm text-muted-foreground">
          {current + 1} / {total}
        </span>
      </div>

      <div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{def.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Вопрос {current + 1} из {total} · {def.timeframe}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base font-medium leading-relaxed">{def.questions[current]}</p>

          <div role="radiogroup" className="space-y-2" aria-label={def.questions[current]}>
            {def.options.map((opt) => {
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((p) => ({ ...p, [current]: opt.value }))}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-accent ${
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : ""
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-primary" : "border-muted-foreground/40"
                    }`}
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="font-normal">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        {isLast ? (
          <Button onClick={finish} disabled={value === undefined}>
            <Check className="h-4 w-4" />
            Завершить
          </Button>
        ) : (
          <Button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} disabled={value === undefined}>
            Далее
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
