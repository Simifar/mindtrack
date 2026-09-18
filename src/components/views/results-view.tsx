"use client";
import { useState } from "react";
import { getTest, formatResultText, scoreTest } from "@/data/tests";
import { loadResults, deleteResult, clearResults, severityColor } from "@/lib/results";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Trash2 } from "lucide-react";

export function ResultsView() {
  const setView = useAppStore((s) => s.setView);
  const setCrisisOpen = useAppStore((s) => s.setCrisisOpen);
  const { toast } = useToast();
  const [items, setItems] = useState(loadResults);
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  function refresh() {
    const next = loadResults();
    setItems(next);
    if (openId && !next.some((r) => r.id === openId)) setOpenId(next[0]?.id ?? null);
  }

  function remove(id: string) {
    deleteResult(id);
    refresh();
    toast({ title: "Результат удалён" });
  }

  function clearAll() {
    clearResults();
    refresh();
    toast({ title: "История очищена" });
  }

  const open = items.find((r) => r.id === openId) ?? null;

  function openText(): string {
    if (!open) return "";
    const def = getTest(open.code);
    if (!def) return "";
    const r = scoreTest(def, open.answers);
    return formatResultText({ def, answers: open.answers, result: r, date: new Date(open.dateISO) });
  }

  function copyOpen() {
    const text = openText();
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: "Скопировано в буфер обмена" }))
      .catch(() => toast({ title: "Не удалось скопировать", variant: "destructive" }));
  }

  function downloadOpen() {
    const text = openText();
    if (!open || !text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindtrack-${open.code}-${open.dateISO.slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4 text-center sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Результаты</h1>
        <p className="text-sm text-muted-foreground">
          Вы ещё не проходили тесты. Результаты сохраняются локально в вашем браузере.
        </p>
        <Button onClick={() => setView("tests")}>К каталогу тестов</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Результаты</h1>
          <p className="text-sm text-muted-foreground">История прохождений — только в вашем браузере</p>
        </div>
        <Button variant="outline" size="sm" onClick={clearAll}>
          <Trash2 className="h-4 w-4" />
          Очистить всё
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((r) => (
          <button
            key={r.id}
            onClick={() => setOpenId(r.id)}
            className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition hover:bg-accent ${
              openId === r.id ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{r.testName}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(r.dateISO).toLocaleString("ru-RU")}
              </div>
            </div>
            <Badge
              variant="outline"
              className="shrink-0"
              style={{ borderColor: severityColor(r.severity), color: severityColor(r.severity) }}
            >
              {r.totalScore} / {r.maxScore} · {r.label}
            </Badge>
          </button>
        ))}
      </div>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{open.testName}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {new Date(open.dateISO).toLocaleString("ru-RU")} · {open.totalScore} / {open.maxScore} — {open.label}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {open.advice && <p className="text-sm text-muted-foreground">{open.advice}</p>}
            {open.crisisDetected && (
              <Button variant="outline" size="sm" onClick={() => setCrisisOpen(true)}>
                Показать контакты помощи
              </Button>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={copyOpen} className="flex-1">
                <Copy className="h-4 w-4" />
                Скопировать текстом
              </Button>
              <Button variant="outline" onClick={downloadOpen} className="flex-1">
                <Download className="h-4 w-4" />
                Скачать .txt
              </Button>
              <Button variant="outline" onClick={() => remove(open.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Это результат самонаблюдения, а не медицинский диагноз. Обсудите его с врачом или
              психотерапевтом.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
