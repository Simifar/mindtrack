"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getTest, formatResultText, scoreTest } from "@/data/tests";
import { clearResults, deleteResult, exportResultsJson, getResultCompleteness, importResultsJson, loadResults, severityColor } from "@/lib/results";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { subscribeStorage } from "@/lib/storage/storage";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResultSummary } from "@/components/app/result-summary";
import { AppLink } from "@/components/app/app-link";
import { cn } from "@/lib/utils";
import { Copy, Download, FileJson, History, LifeBuoy, Printer, Trash2, Upload } from "lucide-react";

export function ResultsView() {
  const setCrisisOpen = useAppStore((s) => s.setCrisisOpen);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);
  const [items, setItems] = useState<ReturnType<typeof loadResults>>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const next = loadResults();
    setItems(next);
    setOpenId((currentOpenId) => (currentOpenId && next.some((result) => result.id === currentOpenId) ? currentOpenId : next[0]?.id ?? null));
  }, []);

  useEffect(() => {
    const requested = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("open");
    const timer = window.setTimeout(() => {
      const next = loadResults();
      setItems(next);
      setOpenId(requested && next.some((result) => result.id === requested) ? requested : next[0]?.id ?? null);
    }, 0);
    const unsubscribe = subscribeStorage(refresh, [STORAGE_KEYS.results, STORAGE_KEYS.resultsLegacy]);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [refresh]);

  useEffect(() => {
    if (!openId || !shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openId]);

  function selectResult(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    shouldScrollRef.current = true;
    setOpenId(id);
  }

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

  const open = items.find((result) => result.id === openId) ?? null;
  const openDef = open ? getTest(open.code) : undefined;
  const openCompleteness = open ? getResultCompleteness(open) : undefined;
  const openScore = open && openDef && openCompleteness === "complete" ? scoreTest(openDef, open.answers) : undefined;
  const sameCode = open ? items.filter((result) => result.code === open.code) : [];
  const openPosition = open ? sameCode.findIndex((result) => result.id === open.id) : -1;
  const previousOpen = openPosition >= 0 ? sameCode[openPosition + 1] ?? null : null;

  function openText(): string {
    if (!open || !openDef) return "";
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

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <History aria-hidden="true" className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Результаты</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Здесь появится история прохождений: балл, категория и дата. Записи хранятся только в этом браузере — их можно экспортировать в JSON или перенести с другого устройства.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <AppLink path="/tests">К каталогу тестов</AppLink>
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload aria-hidden="true" className="h-4 w-4" /> Импортировать JSON
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json,.json" aria-label="Выберите JSON-файл" className="sr-only" onChange={importJson} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Результаты</h1>
          <p className="text-sm text-muted-foreground">
            История прохождений — только в вашем браузере · <span className="tabular-nums">{items.length}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadJson}>
            <FileJson aria-hidden="true" className="h-4 w-4" /> Экспорт JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload aria-hidden="true" className="h-4 w-4" /> Импорт JSON
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Trash2 aria-hidden="true" className="h-4 w-4" /> Очистить всё
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/json,.json" aria-label="Выберите JSON-файл" className="sr-only" onChange={importJson} />

      <div className="no-print space-y-2">
        {items.map((result) => {
          const def = getTest(result.code);
          const completeness = getResultCompleteness(result);
          const color = completeness === "complete" ? severityColor(result.severity) : "var(--sev-neutral)";
          const isOpen = openId === result.id;
          return (
            <button
              key={result.id}
              type="button"
              onClick={() => selectResult(result.id)}
              aria-expanded={isOpen}
              aria-controls="result-detail"
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-xl border p-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                isOpen ? "border-primary/60 bg-primary/5" : "border-border hover:bg-accent",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{result.testName}</span>
                <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                  {new Date(result.dateISO).toLocaleString("ru-RU")}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {completeness === "complete" ? (
                  <>
                    <span className="block text-base font-semibold tabular-nums" style={{ color }}>
                      {result.totalScore}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">из {result.maxScore}</span>
                    </span>
                    <span className="mt-0.5 block max-w-[15rem] text-xs leading-snug" style={{ color }}>
                      {result.label}
                    </span>
                  </>
                ) : (
                  <span className="block max-w-[15rem] text-xs leading-snug text-muted-foreground">
                    Неполный результат · {Object.keys(result.answers).length} из {def?.questions.length ?? "?"} ответов
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {open && (
        <Card id="result-detail" ref={detailRef} className="scroll-mt-24">
          <CardHeader>
            <CardTitle as="h2" className="text-lg">{open.testName}</CardTitle>
            <p className="text-xs tabular-nums text-muted-foreground">
              {new Date(open.dateISO).toLocaleString("ru-RU")}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {openCompleteness === "complete" && openScore && openDef ? (
              <ResultSummary
                def={openDef}
                score={openScore}
                max={open.maxScore}
                previous={previousOpen ? { totalScore: previousOpen.totalScore, dateISO: previousOpen.dateISO } : null}
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Неполный результат · <span className="tabular-nums">{Object.keys(open.answers).length}</span> из{" "}
                <span className="tabular-nums">{openDef?.questions.length ?? "?"}</span> ответов. Балл, категория и рекомендации не рассчитываются.
              </p>
            )}

            {openCompleteness === "complete" && open.crisisDetected ? (
              <Button variant="outline" size="sm" onClick={() => setCrisisOpen(true)} className="gap-2">
                <LifeBuoy aria-hidden="true" className="h-4 w-4" />
                Показать контакты помощи
              </Button>
            ) : null}

            <div className="no-print flex flex-wrap gap-2">
              <Button variant="outline" onClick={copyOpen}>
                <Copy aria-hidden="true" className="h-4 w-4" />
                Скопировать текстом
              </Button>
              <Button variant="outline" onClick={downloadOpen}>
                <Download aria-hidden="true" className="h-4 w-4" />
                Скачать .txt
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer aria-hidden="true" className="h-4 w-4" />
                Печать
              </Button>
              <Button variant="ghost" onClick={() => remove(open.id)} aria-label="Удалить результат" className="text-muted-foreground hover:text-destructive">
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Удалить
              </Button>
            </div>

            <p className="rounded-xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
              {openCompleteness === "complete"
                ? "Это результат самонаблюдения, а не медицинский диагноз. Обсудите его с врачом или психотерапевтом."
                : "Для этой записи недостаточно ответов: балл, категория и рекомендации не рассчитываются. Её можно удалить из истории."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
