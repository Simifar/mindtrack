"use client";
import { useEffect, useState } from "react";
import { api, type TestDetailDTO } from "@/lib/api-client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { severityColor } from "@/lib/test-scoring";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type AnswerMap = Record<string, number | string>;

export function TestRunnerView() {
  const testId = useAppStore((s) => s.activeTestId);
  const setView = useAppStore((s) => s.setView);
  const setCrisisOpen = useAppStore((s) => s.setCrisisOpen);
  const { toast } = useToast();

  const [detail, setDetail] = useState<TestDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    totalScore: number;
    severity: string;
    label: string;
    crisisDetected: boolean;
  } | null>(null);

  useEffect(() => {
    if (!testId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setCurrent(0);
    setAnswers({});
    setResult(null);
    api.tests
      .detail(testId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => setView("tests")}>
          <ArrowLeft className="h-4 w-4" /> К списку тестов
        </Button>
        <p className="mt-4 text-muted-foreground">Тест не найден.</p>
      </div>
    );
  }

  // --- Экран результата ---
  if (result) {
    return (
      <ResultScreen
        detail={detail}
        result={result}
        onCrisis={() => setCrisisOpen(true)}
        onDone={() => setView("tests")}
      />
    );
  }

  const total = detail.questions.length;
  const q = detail.questions[current];
  const value = answers[q.id];
  const isLast = current === total - 1;
  const progress = ((current + 1) / total) * 100;

  async function submit() {
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));
      const res = await api.tests.submit(detail!.definition.id, payload);
      setResult(res);
      if (res.crisisDetected) {
        setCrisisOpen(true);
      }
      toast({ title: "Тест сохранён", description: res.label });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
          <CardTitle className="text-lg">{detail.definition.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Вопрос {current + 1} из {total}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base font-medium leading-relaxed">{q.text}</p>

          {q.isFreeText ? (
            <Textarea
              value={(value as string) ?? ""}
              onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
              placeholder="Ваш ответ..."
              rows={4}
            />
          ) : (
            <div role="radiogroup" className="space-y-2" aria-label={q.text}>
              {q.options.map((opt) => {
                const selected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt.value }))}
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
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        {isLast ? (
          <Button onClick={submit} disabled={submitting || value === undefined}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
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

function ResultScreen({
  detail,
  result,
  onCrisis,
  onDone,
}: {
  detail: TestDetailDTO;
  result: { totalScore: number; severity: string; label: string; crisisDetected: boolean };
  onCrisis: () => void;
  onDone: () => void;
}) {
  const trendData = [...detail.history].reverse().map((h) => ({
    date: new Date(h.completedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    score: h.totalScore,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Результат</CardTitle>
          <p className="text-xs text-muted-foreground">{detail.definition.name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{result.totalScore}</span>
            <span className="text-sm text-muted-foreground">баллов</span>
          </div>
          <div
            className="rounded-lg p-3 text-sm font-medium"
            style={{
              backgroundColor: `color-mix(in srgb, ${severityColor(result.severity)} 14%, transparent)`,
              color: severityColor(result.severity),
            }}
          >
            {result.label}
          </div>

          {result.crisisDetected && (
            <div className="flex flex-col gap-2 rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Мы заметили тяжёлые переживания в ваших ответах
              </div>
              <p>
                Вы не одни. Если у вас есть мысли о причинении себе вреда, пожалуйста, обратитесь за
                поддержкой — это анонимно и бесплатно.
              </p>
              <Button variant="outline" size="sm" className="self-start" onClick={onCrisis}>
                Показать контакты помощи
              </Button>
            </div>
          )}

          <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Это результат самонаблюдения, а не медицинский диагноз. Обсудите его с лечащим врачом или
            психотерапевтом.
          </p>
        </CardContent>
      </Card>

      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Динамика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onDone} className="flex-1">
          К списку тестов
        </Button>
        <Button onClick={() => useAppStore.getState().setView("dashboard")} className="flex-1">
          На дашборд
        </Button>
      </div>
    </div>
  );
}
