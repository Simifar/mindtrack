"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatScore, getTest, formatResultText, scoreTest } from "@/data/tests";
import { clearResults, deleteResult, exportResultsJson, getResultCompleteness, importResultsJson, loadResults, severityColor } from "@/lib/results";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { subscribeStorage } from "@/lib/storage/storage";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileJson, Printer, Trash2, Upload } from "lucide-react";

export function ResultsView() {
  const setView = useAppStore((s) => s.setView);
  const setCrisisOpen = useAppStore((s) => s.setCrisisOpen);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ReturnType<typeof loadResults>>([]);
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  const refresh = useCallback(() => {
    const next = loadResults();
    setItems(next);
    setOpenId((currentOpenId) => currentOpenId && next.some((result) => result.id === currentOpenId) ? currentOpenId : next[0]?.id ?? null);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    const unsubscribe = subscribeStorage(refresh, [STORAGE_KEYS.results, STORAGE_KEYS.resultsLegacy]);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [refresh]);

  function remove(id: string) {
    try {
      deleteResult(id);
      refresh();
      toast({ title: "Результат удалён" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось удалить результат", variant: "destructive" });
    }
  }

  function clearAll() {
    if (!window.confirm("Удалить всю историю результатов? Это действие нельзя отменить.")) return;
    try {
      clearResults();
      refresh();
      toast({ title: "История очищена" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось очистить историю", variant: "destructive" });
    }
  }

  const open = items.find((result) => result.id === openId) ?? null;
  const openDef = open ? getTest(open.code) : undefined;
  const openScore = open && openDef ? scoreTest(openDef, open.answers) : undefined;
  const openCompleteness = open ? getResultCompleteness(open) : undefined;

  function openText(): string {
    if (!open) return "";
    if (!openDef || !openScore) return "";
    return formatResultText({ def: openDef, answers: open.answers, result: openScore, date: new Date(open.dateISO) });
  }

  function copyOpen() {
    const text = openText();
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

  function downloadJson() {
    const blob = new Blob([exportResultsJson()], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindtrack-results-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "JSON-бэкап скачан" });
  }

  function importJson(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    file.text().then((raw) => {
      try {
        const result = importResultsJson(raw);
        refresh();
        toast({ title: `Импортировано результатов: ${result.imported}`, description: result.skipped ? `Пропущено записей: ${result.skipped}` : undefined });
      } catch (error) {
        toast({ title: error instanceof Error ? error.message : "Не удалось импортировать JSON", variant: "destructive" });
      }
    }).catch(() => toast({ title: "Не удалось прочитать файл", variant: "destructive" }));
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Результаты</h1>
        <p className="text-sm text-muted-foreground">
          Вы ещё не проходили тесты. Результаты сохраняются локально в вашем браузере.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => setView("tests")}>К каталогу тестов</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Импортировать JSON</Button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json,.json" aria-label="Выберите JSON-файл" className="sr-only" onChange={importJson} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Результаты</h1>
          <p className="text-sm text-muted-foreground">История прохождений — только в вашем браузере</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadJson}><FileJson className="h-4 w-4" /> Экспорт JSON</Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Импорт JSON</Button>
          <Button variant="outline" size="sm" onClick={clearAll}><Trash2 className="h-4 w-4" /> Очистить всё</Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/json,.json" aria-label="Выберите JSON-файл" className="sr-only" onChange={importJson} />

      <div className="no-print space-y-2">
        {items.map((result) => (
          <button
            key={result.id}
            type="button"
            onClick={() => setOpenId(result.id)}
            className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition hover:bg-accent ${
              openId === result.id ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{result.testName}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(result.dateISO).toLocaleString("ru-RU")}
              </div>
            </div>
              <Badge
              variant="outline"
              className="shrink-0"
              style={{ borderColor: severityColor(result.severity), color: severityColor(result.severity) }}
            >
              {result.totalScore} / {result.maxScore} · {result.label}{getResultCompleteness(result) === "incomplete" ? " · Неполный" : ""}
            </Badge>
          </button>
        ))}
      </div>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{open.testName}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {new Date(open.dateISO).toLocaleString("ru-RU")} · {openDef && openScore ? formatScore(openDef, openScore) : `${open.totalScore} из ${open.maxScore}`} — {open.label}{openCompleteness === "incomplete" ? " · Неполный результат" : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {open.advice && <p className="text-sm text-muted-foreground">{open.advice}</p>}
            {openDef?.code === "WHO5" && openScore && <p className="text-sm text-muted-foreground">Нормированный результат: {openScore.normalizedScore} из 100</p>}
            {open.crisisDetected && (
              <Button variant="outline" size="sm" onClick={() => setCrisisOpen(true)}>
                Показать контакты помощи
              </Button>
            )}
            <div className="no-print flex flex-wrap gap-2">
              <Button variant="outline" onClick={copyOpen} className="flex-1">
                <Copy className="h-4 w-4" />
                Скопировать текстом
              </Button>
              <Button variant="outline" onClick={downloadOpen} className="flex-1">
                <Download className="h-4 w-4" />
                Скачать .txt
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="flex-1">
                <Printer className="h-4 w-4" />
                Печать
              </Button>
              <Button variant="outline" onClick={() => remove(open.id)} aria-label="Удалить результат">
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
