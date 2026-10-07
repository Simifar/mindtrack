"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getOptions, getTest, scoreTest, maxScore, formatResultText, type ScoreResult } from "@/data/tests";
import { loadResultsByCode, saveResult } from "@/lib/results";
import { deleteDraft, loadDraft, saveDraft } from "@/lib/progress";
import { getCrisisPolicy } from "@/lib/crisis";
import { testPath } from "@/lib/routes";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ResultSummary, type PreviousScore } from "@/components/app/result-summary";
import { AppLink } from "@/components/app/app-link";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowLeft, ArrowRight, BookHeart, Check, ClipboardPenLine, Copy, Download, History, Printer, RotateCcw, X, type LucideIcon } from "lucide-react";
import { TestBadgeIcon } from "@/components/app/test-icon";

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
  const questionRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const moveFocusRef = useRef(false);

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

  // После перехода кнопками фокус переносится на текст нового вопроса,
  // чтобы скринридер прочитал его, а клавиатура осталась внутри формы.
  useEffect(() => {
    if (!moveFocusRef.current) return;
    moveFocusRef.current = false;
    questionRef.current?.focus({ preventScroll: true });
  }, [current]);

  useEffect(() => {
    if (done) resultRef.current?.focus({ preventScroll: true });
  }, [done]);

  if (!def) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" asChild>
          <AppLink path="/tests">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> К каталогу тестов
          </AppLink>
        </Button>
        <h1 className="page-title">Тест не найден</h1>
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
    window.scrollTo({ top: 0 });
  }

  function goTo(index: number) {
    moveFocusRef.current = true;
    setCurrent(Math.min(total - 1, Math.max(0, index)));
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
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-start gap-4">
          <TestBadgeIcon code={def.code} size="lg" />
          <div className="min-w-0">
            <p className="eyebrow">Результат сохранён</p>
            <h1 ref={resultRef} tabIndex={-1} className="mt-1 text-2xl font-semibold leading-tight tracking-tight outline-none sm:text-3xl">
              {def.name}
            </h1>
            <p className="mt-1 text-sm tabular-nums text-muted-foreground">
              {date.toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </header>

        {result.crisisDetected && (
          <div role="note" className="flex flex-col gap-2 rounded-2xl border border-attention/40 bg-attention-surface p-4 text-sm text-attention-foreground">
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

        <section aria-label="Итог" className="animate-rise rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-7">
          <ResultSummary def={def} score={result} max={maxScore(def)} previous={previous} />
          <p className="mt-6 border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
            Это результат самонаблюдения, а не медицинский диагноз. Обсудите его с врачом или
            психотерапевтом. Результат сохранён в вашем браузере.
          </p>
        </section>

        <section aria-labelledby="next-heading" className="no-print space-y-3">
          <h2 id="next-heading" className="font-semibold">Что можно сделать дальше</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <NextStep path={`/results?open=${encodeURIComponent(id)}`} icon={History} title="Открыть в истории" text="Сравнить с прошлыми прохождениями" />
            <NextStep path="/diary" icon={BookHeart} title="Записать в дневник" text="Отметить, что повлияло на состояние" />
            <NextStep path="/visit" icon={ClipboardPenLine} title="Подготовиться к приёму" text="Собрать вопросы для специалиста" />
          </div>
        </section>

        <section aria-labelledby="share-heading" className="no-print space-y-3">
          <h2 id="share-heading" className="font-semibold">Сохранить или показать врачу</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="outline" onClick={copyResult}>
              <Copy aria-hidden="true" className="h-4 w-4" />
              Скопировать текстом
            </Button>
            <Button variant="outline" onClick={downloadTxt}>
              <Download aria-hidden="true" className="h-4 w-4" />
              Скачать .txt
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer aria-hidden="true" className="h-4 w-4" />
              Печать отчёта
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={restart}>
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Пройти заново
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <AppLink path="/tests">К каталогу тестов</AppLink>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const options = getOptions(def, current);
  // Роуминг-табиндекс: в группу попадаем одним Tab, внутри — стрелками.
  const tabStop = value === undefined ? options[0]?.value : value;

  function handleOptionKeys(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0 || !isHydrated) return;
    event.preventDefault();
    const radios = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    const focused = radios.indexOf(document.activeElement as HTMLButtonElement);
    const from = focused === -1 ? Math.max(0, options.findIndex((option) => option.value === value)) : focused;
    const nextIndex = (from + step + radios.length) % radios.length;
    radios[nextIndex]?.focus();
    selectAnswer(options[nextIndex].value);
  }

  // Цифры 1–9 выбирают вариант по номеру; не мешаем полям ввода и открытым диалогам.
  function handleDigit(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || !isHydrated) return;
    if ((event.target as HTMLElement).closest("input, textarea, select, [aria-modal='true']")) return;
    const digit = Number(event.key);
    if (!Number.isInteger(digit) || digit < 1 || digit > options.length) return;
    event.preventDefault();
    selectAnswer(options[digit - 1].value);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5" onKeyDown={handleDigit}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <TestBadgeIcon code={def.code} size="sm" className="hidden sm:flex" />
          <div className="min-w-0">
            <h1 className="font-semibold leading-snug">{def.name}</h1>
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{def.timeframe}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <AppLink path={testPath(def.code)} title="Ответы сохранятся, можно продолжить позже">
            <X aria-hidden="true" className="h-4 w-4" />
            Выйти
          </AppLink>
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
                index === current ? "bg-primary" : answers[index] !== undefined ? "bg-primary/45" : "bg-muted",
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{current + 1} / {total}</span>
          <span className="tabular-nums">Отвечено: {answeredCount}</span>
        </div>
      </div>

      <section aria-labelledby="question-text" className="rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-7">
        <h2
          id="question-text"
          ref={questionRef}
          tabIndex={-1}
          className="text-lg font-semibold leading-relaxed tracking-tight outline-none sm:text-xl"
        >
          {def.questions[current]}
        </h2>

        <div
          role="radiogroup"
          aria-labelledby="question-text"
          aria-busy={!isHydrated}
          onKeyDown={handleOptionKeys}
          className="mt-5 space-y-2"
        >
          {options.map((opt, index) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!isHydrated}
                tabIndex={opt.value === tabStop ? 0 : -1}
                onClick={() => selectAnswer(opt.value)}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait",
                  selected
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-card hover:border-primary/40 hover:bg-surface",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold tabular-nums transition",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  {selected ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="leading-snug">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {isHydrated && value === undefined ? (
          <p className="mt-4 text-xs text-muted-foreground">Выберите один вариант, чтобы продолжить.</p>
        ) : null}
      </section>

      <div className="no-print action-dock sticky z-20 -mx-2 flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-raised backdrop-blur">
        <Button variant="outline" onClick={() => goTo(current - 1)} disabled={!isHydrated || current === 0}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Назад
        </Button>
        <p className="hidden text-xs text-muted-foreground sm:block">Ответы сохраняются автоматически</p>
        {isLast ? (
          <Button onClick={finish} disabled={!isHydrated || value === undefined}>
            <Check aria-hidden="true" className="h-4 w-4" />
            Завершить
          </Button>
        ) : (
          <Button onClick={() => goTo(current + 1)} disabled={!isHydrated || value === undefined}>
            Далее
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function NextStep({ path, icon: Icon, title, text }: { path: string; icon: LucideIcon; title: string; text: string }) {
  return (
    <AppLink
      path={path}
      className="flex min-h-11 items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 transition hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex-col"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{text}</span>
      </span>
    </AppLink>
  );
}
