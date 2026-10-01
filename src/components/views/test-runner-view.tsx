"use client";
import { useEffect, useState } from "react";
import { getOptions, getTest, scoreTest, maxScore, formatResultText, type ScoreResult } from "@/data/tests";
import { loadResultsByCode, saveResult } from "@/lib/results";
import { deleteDraft, loadDraft, saveDraft } from "@/lib/progress";
import { getCrisisPolicy } from "@/lib/crisis";
import { navigateToView } from "@/lib/navigation";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResultSummary, type PreviousScore } from "@/components/app/result-summary";
import { AppLink } from "@/components/app/app-link";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ClipboardList, Copy, Download, History, Printer, RotateCcw, X } from "lucide-react";

type Answers = Record<number, number>;

type DoneState = {
  result: ScoreResult;
  date: Date;
  id: string;
  previous: PreviousScore | null;
};

export function TestRunnerView({ codeOverride }: { codeOverride?: string }) {
  const code = codeOverride;
  const setCrisisOpen = useAppStore((s) => s.setCrisisOpen);
  const { toast } = useToast();

  const def = code ? getTest(code) : undefined;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState<DoneState | null>(null);
  const [hydratedCode, setHydratedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    const timer = window.setTimeout(() => {
      const draft = loadDraft(code);
      if (draft) {
        setCurrent(draft.current);
        setAnswers(draft.answers);
      } else {
        setCurrent(0);
        setAnswers({});
      }
      setHydratedCode(code);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    if (!code || !def || done || hydratedCode !== code) return;
    saveDraft({ code, current, answers });
  }, [answers, code, current, def, done, hydratedCode]);

  if (!def) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" onClick={() => navigateToView("tests")}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> К списку тестов
        </Button>
        <p className="text-muted-foreground">Тест не найден.</p>
      </div>
    );
  }

  const total = def.questions.length;
  const isHydrated = hydratedCode === code;
  const value = answers[current];
  const isLast = current === total - 1;
  const answeredCount = Object.keys(answers).length;

  function restart() {
    if (code) deleteDraft(code);
    setCurrent(0);
    setAnswers({});
    setDone(null);
  }

  function finish() {
    if (!def) return;
    const result = scoreTest(def, answers);
    const date = new Date();
    const previous = loadResultsByCode(def.code)[0] ?? null;
    try {
      const saved = saveResult({
        code: def.code,
        testName: def.name,
        dateISO: date.toISOString(),
        totalScore: result.totalScore,
        maxScore: maxScore(def),
        severity: result.severity,
        label: result.label,
        advice: result.advice,
        crisisDetected: result.crisisDetected,
        answers: { ...answers },
      });
      deleteDraft(def.code);
      setDone({
        result,
        date,
        id: saved.id,
        previous: previous ? { totalScore: previous.totalScore, dateISO: previous.dateISO } : null,
      });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось сохранить результат", variant: "destructive" });
      return;
    }
    if (getCrisisPolicy("screening", result.crisisDetected).shouldOpenDialog) setCrisisOpen(true);
  }

  function selectAnswer(next: number) {
    if (!def) return;
    setAnswers((previous) => ({ ...previous, [current]: next }));
    const crisis = getCrisisPolicy("screening", def.scoring.crisisQuestionIndexes?.includes(current) && next > 0);
    if (crisis.shouldOpenDialog) setCrisisOpen(true);
  }

  function exportText(): string {
    if (!def || !done) return "";
    return formatResultText({ def, answers, result: done.result, date: done.date });
  }

  function copyResult() {
    const text = exportText();
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => toast({ title: "Скопировано в буфер обмена" }))
        .catch(() => toast({ title: "Не удалось скопировать", variant: "destructive" }));
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    toast(copied ? { title: "Скопировано в буфер обмена" } : { title: "Не удалось скопировать", variant: "destructive" });
  }

  function downloadTxt() {
    const text = exportText();
    if (!text || !def || !done) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindtrack-${def.code.toLowerCase()}-${done.date.toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- Экран результата ----------
  if (done) {
    const { result, date, id, previous } = done;
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{def.name}</h1>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">{date.toLocaleString("ru-RU")}</p>
        </header>

        <Card className="py-6">
          <CardContent className="space-y-5">
            <ResultSummary def={def} score={result} max={maxScore(def)} previous={previous} />

            {result.crisisDetected && (
              <div className="flex flex-col gap-2 rounded-xl border border-attention/40 bg-attention-surface p-4 text-sm text-attention-foreground">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                  Ответ требует внимания
                </div>
                <p>
                  Вы отметили мысли о причинении себе вреда. Вы не одни — обратитесь за поддержкой прямо сейчас. В непосредственной опасности звоните 112.
                </p>
                <Button variant="outline" size="sm" className="self-start" onClick={() => setCrisisOpen(true)}>
                  Показать контакты помощи
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="no-print space-y-2">
          <Button onClick={copyResult} className="w-full">
            <Copy aria-hidden="true" className="h-4 w-4" />
            Скопировать текстом
          </Button>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={downloadTxt}>
              <Download aria-hidden="true" className="h-4 w-4" />
              Скачать .txt
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer aria-hidden="true" className="h-4 w-4" />
              Печать отчёта
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="ghost" size="sm" onClick={restart}>
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Пройти заново
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <AppLink path={`/results?open=${id}`}>
                <History aria-hidden="true" className="h-4 w-4" />
                Открыть в истории
              </AppLink>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <AppLink path="/tests">
                <ClipboardList aria-hidden="true" className="h-4 w-4" />
                К каталогу тестов
              </AppLink>
            </Button>
          </div>
        </div>

        <p className="rounded-xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
          Это результат самонаблюдения, а не медицинский диагноз. Обсудите его с врачом или
          психотерапевтом. Результат сохранён в вашем браузере.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight">{def.name}</h1>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{def.timeframe}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigateToView("tests")} className="shrink-0">
          <X aria-hidden="true" className="h-4 w-4" />
          Выйти
        </Button>
      </div>

      <div className="space-y-2">
        <div
          role="progressbar"
          aria-label="Прогресс по вопросам"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredCount}
          aria-valuetext={`Отвечено ${answeredCount} из ${total}`}
          className="flex items-center gap-1"
        >
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index === current ? "bg-primary" : answers[index] !== undefined ? "bg-primary/50" : "bg-muted",
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="tabular-nums">{current + 1} / {total}</span>
          <span className="tabular-nums">Отвечено: {answeredCount}</span>
        </div>
      </div>

      <Card className="py-6">
        <CardContent className="space-y-5">
          <p className="text-lg font-semibold leading-relaxed">{def.questions[current]}</p>

          <div
            role="radiogroup"
            aria-label={def.questions[current]}
            aria-busy={!isHydrated}
            className="space-y-2"
          >
            {getOptions(def, current).map((opt) => {
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!isHydrated}
                  onClick={() => selectAnswer(opt.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    selected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected ? "border-primary" : "border-muted-foreground/50",
                    )}
                  >
                    {selected ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                  </span>
                  <span className="leading-snug">{opt.label}</span>
                  {selected ? <Check aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-primary" /> : null}
                </button>
              );
            })}
          </div>

          {isHydrated && value === undefined ? (
            <p className="text-xs text-muted-foreground">Выберите один вариант, чтобы продолжить.</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="no-print sticky bottom-24 z-20 -mx-2 flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background/85 p-2 backdrop-blur lg:bottom-4">
        <Button
          variant="outline"
          onClick={() => setCurrent((index) => Math.max(0, index - 1))}
          disabled={!isHydrated || current === 0}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Назад
        </Button>
        {isLast ? (
          <Button onClick={finish} disabled={!isHydrated || value === undefined}>
            <Check aria-hidden="true" className="h-4 w-4" />
            Завершить
          </Button>
        ) : (
          <Button
            onClick={() => setCurrent((index) => Math.min(total - 1, index + 1))}
            disabled={!isHydrated || value === undefined}
          >
            Далее
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
