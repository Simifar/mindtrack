"use client";
import { useState } from "react";
import { getOptions, getTest, scoreTest, maxScore, formatResultText, formatScore } from "@/data/tests";
import { saveResult, severityColor } from "@/lib/results";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Copy, Download, RotateCcw } from "lucide-react";

type Answers = Record<number, number>;

export function TestRunnerView() {
  const code = useAppStore((s) => s.activeTestCode);
  const setView = useAppStore((s) => s.setView);
  const setCrisisOpen = useAppStore((s) => s.setCrisisOpen);
  const { toast } = useToast();

  const def = code ? getTest(code) : undefined;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState<{ result: ReturnType<typeof scoreTest>; date: Date } | null>(null);

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

  function restart() {
    setCurrent(0);
    setAnswers({});
    setDone(null);
  }

  function finish() {
    if (!def) return;
    const r = scoreTest(def, answers);
    const date = new Date();
    try {
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
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось сохранить результат", variant: "destructive" });
      return;
    }
    setDone({ result: r, date });
    if (r.crisisDetected) setCrisisOpen(true);
  }

  function selectAnswer(value: number) {
    if (!def) return;
    setAnswers((previous) => ({ ...previous, [current]: value }));
    if (def.scoring.crisisQuestionIndexes?.includes(current) && value > 0) setCrisisOpen(true);
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
    const r = done.result;
    const color = severityColor(r.severity);
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <Card className="py-6">
          <CardContent className="space-y-5 px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{def.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{done.date.toLocaleString("ru-RU")}</p>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold leading-none">{r.totalScore}</span>
              <span className="pb-1 text-lg text-muted-foreground">{formatScore(def, r).replace(String(r.totalScore), "").trim()}</span>
            </div>

            {r.normalizedScore !== undefined && def.scoring.normalizedScore && (
              <p className="text-sm text-muted-foreground">Нормированный результат WHO-5: <strong>{r.normalizedScore}</strong> {def.scoring.normalizedScore.label}</p>
            )}

            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
              }}
            >
              <p className="font-semibold" style={{ color }}>
                {r.label}
              </p>
              {r.advice && <p className="mt-1 text-sm text-foreground/80">{r.advice}</p>}
            </div>

            {r.crisisDetected && (
              <div className="flex flex-col gap-2 rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
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

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={copyResult}>
                <Copy className="h-4 w-4" />
                Скопировать текстом
              </Button>
              <Button variant="outline" onClick={downloadTxt}>
                <Download className="h-4 w-4" />
                Скачать .txt
              </Button>
            </div>

            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              Это результат самонаблюдения, а не медицинский диагноз. Обсудите его с врачом или
              психотерапевтом. Результат сохранён в вашем браузере.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={restart} className="flex-1">
            <RotateCcw className="h-4 w-4" />
            Пройти заново
          </Button>
          <Button onClick={() => setView("tests")} className="flex-1">
            К списку тестов
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => setView("tests")}>
          <ArrowLeft className="h-4 w-4" />
          Выйти
        </Button>
        <span className="text-sm text-muted-foreground">
          {current + 1} / {total}
        </span>
      </div>

      <Progress value={progress} className="h-1.5" />

      <Card className="py-6">
        <CardContent className="space-y-5 px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{def.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{def.timeframe}</p>
          </div>

          <p className="text-lg font-semibold leading-relaxed">{def.questions[current]}</p>

          <div role="radiogroup" className="space-y-2" aria-label={def.questions[current]}>
            {getOptions(def, current).map((opt) => {
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectAnswer(opt.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-accent ${
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
        <Button variant="outline" onClick={() => setCurrent((index) => Math.max(0, index - 1))} disabled={current === 0}>
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        {isLast ? (
          <Button onClick={finish} disabled={value === undefined}>
            <Check className="h-4 w-4" />
            Завершить
          </Button>
        ) : (
          <Button onClick={() => setCurrent((index) => Math.min(total - 1, index + 1))} disabled={value === undefined}>
            Далее
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

