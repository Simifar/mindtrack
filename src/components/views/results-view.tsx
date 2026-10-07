"use client";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { getTest, formatResultText, maxScore, scoreTest, type TestDefinition } from "@/data/tests";
import { clearResults, deleteResult, exportResultsJson, getResultCompleteness, importResultsJson, loadResults, severityColor, type SavedResult } from "@/lib/results";
import { formatRelativeDay, plural, summarizeResults, unitForms, type TestSummary } from "@/lib/insights";
import { testPath } from "@/lib/routes";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { subscribeStorage } from "@/lib/storage/storage";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ResultSummary } from "@/components/app/result-summary";
import { AppLink } from "@/components/app/app-link";
import { PageHeader, SectionHeading } from "@/components/app/page-header";
import { TestBadgeIcon } from "@/components/app/test-icon";
import { scaleSegments } from "@/components/app/score-scale";
import { Sparkline, TrendChart } from "@/components/app/trend-chart";
import { cn } from "@/lib/utils";
import { ChevronDown, Copy, Download, FileJson, History, LifeBuoy, LockKeyhole, Printer, RotateCcw, Trash2, Upload } from "lucide-react";

const ALL = "all";

/** «PHQ-9 — шкала депрессии» → «PHQ-9» для фильтров и подписей. */
function shortName(def: TestDefinition | undefined, fallback: string): string {
  return (def?.name ?? fallback).split(" — ")[0];
}

function monthLabel(iso: string): string {
  const label = new Date(iso).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(/\s*г\.$/, "");
}

function readQuery(): { open: string | null; test: string | null } {
  const params = new URLSearchParams(window.location.search);
  return { open: params.get("open"), test: params.get("test") };
}

function writeFilterToUrl(code: string) {
  const url = new URL(window.location.href);
  if (code === ALL) url.searchParams.delete("test");
  else url.searchParams.set("test", code);
  url.searchParams.delete("open");
  window.history.replaceState(window.history.state, "", url);
}

export function ResultsView() {
  const setCrisisOpen = useAppStore((s) => s.setCrisisOpen);
  const { toast } = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<SavedResult[] | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [filter, setFilter] = useState<string>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);

  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const refresh = useCallback(() => {
    const next = loadResults();
    const code = filterRef.current === ALL || next.some((result) => result.code === filterRef.current) ? filterRef.current : ALL;
    setItems(next);
    setNow(new Date());
    setFilter(code);
    // Если открытая запись исчезла (удаление, импорт, другая вкладка) — раскрываем первую видимую, как при загрузке.
    setOpenId((current) =>
      current && next.some((result) => result.id === current)
        ? current
        : next.find((result) => code === ALL || result.code === code)?.id ?? null,
    );
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = loadResults();
      const query = readQuery();
      const requested = query.open ? next.find((result) => result.id === query.open) : undefined;
      const code = query.test && next.some((result) => result.code === query.test) ? query.test : requested?.code ?? ALL;
      setItems(next);
      setNow(new Date());
      setFilter(code);
      setOpenId(requested?.id ?? next.find((result) => code === ALL || result.code === code)?.id ?? null);
      if (requested) {
        window.requestAnimationFrame(() => {
          document.getElementById(`result-${requested.id}`)?.scrollIntoView({ block: "start" });
        });
      }
    }, 0);
    const unsubscribe = subscribeStorage(refresh, [STORAGE_KEYS.results, STORAGE_KEYS.resultsLegacy]);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [refresh]);

  function selectFilter(code: string) {
    setFilter(code);
    writeFilterToUrl(code);
    const first = (items ?? []).find((result) => code === ALL || result.code === code);
    setOpenId(first?.id ?? null);
  }

  async function remove(result: SavedResult) {
    const accepted = await confirm({
      title: "Удалить результат?",
      description: `${result.testName}, ${new Date(result.dateISO).toLocaleDateString("ru-RU")}. Запись исчезнет из истории и графика.`,
      confirmLabel: "Удалить",
      destructive: true,
    });
    if (!accepted) return;
    try {
      deleteResult(result.id);
      refresh();
      toast({ title: "Результат удалён" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось удалить результат", variant: "destructive" });
    }
  }

  async function clearAll() {
    const count = items?.length ?? 0;
    const accepted = await confirm({
      title: "Удалить всю историю результатов?",
      description: `Из этого браузера будут удалены ${count} ${plural(count, ["запись", "записи", "записей"])}. Это действие нельзя отменить — при необходимости сначала сохраните JSON-бэкап.`,
      confirmLabel: "Удалить всё",
      destructive: true,
    });
    if (!accepted) return;
    try {
      clearResults();
      refresh();
      toast({ title: "История очищена" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось очистить историю", variant: "destructive" });
    }
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
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

  const fileInput = (
    <input ref={fileInputRef} type="file" accept="application/json,.json" aria-label="Выберите JSON-файл" className="sr-only" onChange={importJson} />
  );

  if (items === null || now === null) {
    return (
      <div className="space-y-8" aria-busy="true">
        <PageHeader eyebrow="Мои данные" title="История результатов" className="no-print" />
        <div aria-hidden="true" className="space-y-3">
          <div className="h-10 w-2/3 animate-pulse rounded-xl bg-muted/60" />
          <div className="h-48 animate-pulse rounded-2xl bg-muted/50" />
          <div className="h-16 animate-pulse rounded-2xl bg-muted/50" />
        </div>
        {fileInput}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Мои данные" title="История результатов" className="no-print" />
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <History aria-hidden="true" className="h-6 w-6" />
          </span>
          <div className="max-w-md space-y-2">
            <h2 className="text-lg font-semibold">Пока нет ни одного результата</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              После первого теста здесь появятся балл, категория и график изменений. Записи хранятся только в этом браузере — их можно перенести с другого устройства через JSON.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <AppLink path="/tests">Выбрать тест</AppLink>
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload aria-hidden="true" className="h-4 w-4" /> Импортировать JSON
            </Button>
          </div>
        </div>
        {fileInput}
        {confirmDialog}
      </div>
    );
  }

  const summaries = summarizeResults(items, now);
  const activeSummary = filter === ALL ? undefined : summaries.find((summary) => summary.def.code === filter);
  const visible = filter === ALL ? items : items.filter((result) => result.code === filter);

  const groups: { label: string; results: SavedResult[] }[] = [];
  for (const result of visible) {
    const label = monthLabel(result.dateISO);
    const last = groups.at(-1);
    if (last?.label === label) last.results.push(result);
    else groups.push({ label, results: [result] });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Мои данные"
        title="История результатов"
        className="no-print"
        description={
          <p>
            <span className="tabular-nums">{items.length}</span> {plural(items.length, ["запись", "записи", "записей"])} по{" "}
            <span className="tabular-nums">{summaries.length}</span> {plural(summaries.length, ["методике", "методикам", "методикам"])}. Хранится только в этом браузере.
          </p>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={downloadJson}>
              <FileJson aria-hidden="true" className="h-4 w-4" /> Экспорт JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload aria-hidden="true" className="h-4 w-4" /> Импорт JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-destructive">
              <Trash2 aria-hidden="true" className="h-4 w-4" /> Очистить всё
            </Button>
          </>
        }
      />
      {fileInput}

      <div role="group" aria-label="Показать результаты" className="no-print -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <FilterChip pressed={filter === ALL} onClick={() => selectFilter(ALL)} label="Все" count={items.length} />
        {summaries.map((summary) => (
          <FilterChip
            key={summary.def.code}
            pressed={filter === summary.def.code}
            onClick={() => selectFilter(summary.def.code)}
            label={shortName(summary.def, summary.latest.testName)}
            count={summary.count}
          />
        ))}
      </div>

      {activeSummary ? (
        <TrendSection summary={activeSummary} />
      ) : (
        <section aria-labelledby="overview-heading" className="no-print space-y-4">
          <SectionHeading id="overview-heading" title="Последнее по каждой методике" description="Нажмите на карточку, чтобы увидеть динамику." />
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summaries.map((summary) => (
              <li key={summary.def.code} className="min-w-0">
                <OverviewTile summary={summary} now={now} onSelect={() => selectFilter(summary.def.code)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="records-heading" className="space-y-4">
        <SectionHeading
          id="records-heading"
          className="no-print"
          title={activeSummary ? `Записи ${shortName(activeSummary.def, "")}` : "Все записи"}
          description="Откройте запись, чтобы увидеть подробности, скопировать или распечатать отчёт."
        />
        {groups.map((group) => (
          <div key={group.label} className="space-y-2">
            <h3 className="no-print text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.label}</h3>
            <ul className="space-y-2">
              {group.results.map((result) => (
                <ResultRow
                  key={result.id}
                  result={result}
                  previous={previousComplete(items, result)}
                  isOpen={openId === result.id}
                  onToggle={() => setOpenId((current) => (current === result.id ? null : result.id))}
                  onDelete={() => remove(result)}
                  onCrisis={() => setCrisisOpen(true)}
                />
              ))}
            </ul>
          </div>
        ))}
      </section>

      <p className="no-print flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <LockKeyhole aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        История не синхронизируется. Чтобы перенести её на другое устройство или в другой браузер, сохраните JSON и импортируйте его там.
      </p>
      {confirmDialog}
    </div>
  );
}

/** Предыдущий полный результат той же методики — для сравнения внутри записи. */
function previousComplete(items: SavedResult[], result: SavedResult): SavedResult | null {
  return (
    items.find(
      (candidate) =>
        candidate.code === result.code &&
        candidate.dateISO < result.dateISO &&
        candidate.totalScore !== null &&
        getResultCompleteness(candidate) === "complete",
    ) ?? null
  );
}

function FilterChip({ pressed, onClick, label, count }: { pressed: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        pressed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
      )}
    >
      {label}
      <span className={cn("tabular-nums text-xs", pressed ? "text-primary-foreground/80" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}

function OverviewTile({ summary, now, onSelect }: { summary: TestSummary; now: Date; onSelect: () => void }) {
  const complete = summary.latestComplete;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-full w-full flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 text-left shadow-card transition hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="flex items-center gap-3">
        <TestBadgeIcon code={summary.def.code} size="sm" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{shortName(summary.def, summary.latest.testName)}</span>
          <span className="block text-xs text-muted-foreground">{summary.def.short}</span>
        </span>
      </span>
      <span className="flex items-end justify-between gap-3">
        <span className="min-w-0 text-xs">
          {complete ? (
            <span className="flex items-start gap-1.5 font-medium">
              <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: severityColor(complete.severity) }} />
              <span>
                <span className="tabular-nums">{complete.totalScore} из {complete.maxScore}</span> · {complete.label}
              </span>
            </span>
          ) : (
            <span className="block text-muted-foreground">Нет полного результата</span>
          )}
          <span className="mt-0.5 block text-muted-foreground">
            {formatRelativeDay(summary.latest.dateISO, now)} · {summary.count} {plural(summary.count, ["запись", "записи", "записей"])}
          </span>
        </span>
        <Sparkline
          values={summary.completeSeries.slice(-8).map((result) => result.totalScore as number)}
          max={complete?.maxScore ?? 1}
          className="h-7 w-16 shrink-0 text-primary"
        />
      </span>
    </button>
  );
}

function TrendSection({ summary }: { summary: TestSummary }) {
  const { def, completeSeries } = summary;
  const max = maxScore(def);
  const segments = scaleSegments(def);
  const name = shortName(def, summary.latest.testName);

  return (
    <section aria-labelledby="trend-heading" className="no-print space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-6">
      <SectionHeading
        id="trend-heading"
        title={`Динамика ${name}`}
        description={def.periodicity}
        action={
          <Button asChild variant="outline" size="sm">
            <AppLink path={testPath(def.code)}>
              <RotateCcw aria-hidden="true" className="h-4 w-4" /> Пройти снова
            </AppLink>
          </Button>
        }
      />
      {completeSeries.length >= 2 ? (
        <>
          <TrendChart
            title={`Динамика ${name}: полные результаты по датам`}
            points={completeSeries.map((result) => ({ id: result.id, dateISO: result.dateISO, value: result.totalScore as number, note: result.label }))}
            max={max}
            unit={unitForms(def)[2]}
            bands={segments.map(({ from, to, color }) => ({ from, to, color }))}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {def.code === "WHO5"
              ? "Для WHO-5 более высокий балл означает лучшее самочувствие."
              : "Более высокий балл означает больше отмеченных симптомов."}{" "}
            Изменение на графике — повод для разговора со специалистом, а не вывод о диагнозе.
          </p>
        </>
      ) : (
        <p className="rounded-xl bg-surface p-4 text-sm leading-relaxed text-muted-foreground">
          {completeSeries.length === 1
            ? "Пока есть один полный результат. Пройдите тест ещё раз через рекомендуемый интервал — здесь появится график изменений."
            : "Полных результатов пока нет: неполные записи не попадают на график."}
        </p>
      )}
    </section>
  );
}

function ResultRow({
  result,
  previous,
  isOpen,
  onToggle,
  onDelete,
  onCrisis,
}: {
  result: SavedResult;
  previous: SavedResult | null;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onCrisis: () => void;
}) {
  const { toast } = useToast();
  const def = getTest(result.code);
  const completeness = getResultCompleteness(result);
  const isComplete = completeness === "complete";
  const score = isComplete && def ? scoreTest(def, result.answers) : undefined;
  const color = isComplete ? severityColor(result.severity) : "var(--sev-neutral)";
  const detailId = `result-${result.id}`;
  const date = new Date(result.dateISO);

  function text(): string {
    if (!def) return "";
    return formatResultText({ def, answers: result.answers, result: score, date });
  }

  function copy() {
    const value = text();
    if (!value) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value)
        .then(() => toast({ title: "Скопировано в буфер обмена" }))
        .catch(() => toast({ title: "Не удалось скопировать", variant: "destructive" }));
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    toast(copied ? { title: "Скопировано в буфер обмена" } : { title: "Не удалось скопировать", variant: "destructive" });
  }

  function download() {
    const value = text();
    if (!value) return;
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mindtrack-${result.code}-${result.dateISO.slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <li
      id={detailId}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border bg-card transition-colors",
        isOpen ? "border-primary/40 shadow-card" : "border-border/80 print:hidden",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${detailId}-detail`}
        className="no-print flex min-h-16 w-full items-center gap-3 p-3.5 text-left transition hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:p-4"
      >
        <TestBadgeIcon code={result.code} size="sm" className="hidden sm:flex" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{result.testName}</span>
          <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
            {date.toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </span>
        </span>
        <span className="max-w-[45%] shrink-0 text-right sm:max-w-[16rem]">
          {isComplete ? (
            <>
              <span className="block text-base font-semibold tabular-nums">
                {result.totalScore}
                <span className="ml-1 text-xs font-normal text-muted-foreground">из {result.maxScore}</span>
              </span>
              <span className="mt-0.5 flex items-start justify-end gap-1.5 text-xs leading-snug text-muted-foreground">
                <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span>{result.label}</span>
              </span>
            </>
          ) : (
            <span className="block text-xs leading-snug text-muted-foreground">
              Неполный результат · {Object.keys(result.answers).length} из {def?.questions.length ?? "?"} ответов
            </span>
          )}
        </span>
        <ChevronDown aria-hidden="true" className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen ? (
        <div id={`${detailId}-detail`} className="space-y-5 border-t border-border/60 p-4 sm:p-6">
          <div className="hidden print:block">
            <h2 className="text-lg font-semibold">{result.testName}</h2>
            <p className="text-xs tabular-nums text-muted-foreground">{date.toLocaleString("ru-RU")}</p>
          </div>

          {isComplete && score && def ? (
            <ResultSummary
              def={def}
              score={score}
              max={result.maxScore}
              previous={previous ? { totalScore: previous.totalScore, dateISO: previous.dateISO } : null}
            />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Неполный результат · <span className="tabular-nums">{Object.keys(result.answers).length}</span> из{" "}
              <span className="tabular-nums">{def?.questions.length ?? "?"}</span> ответов. Балл, категория и рекомендации не рассчитываются.
            </p>
          )}

          {isComplete && result.crisisDetected ? (
            <Button variant="outline" size="sm" onClick={onCrisis}>
              <LifeBuoy aria-hidden="true" className="h-4 w-4" />
              Показать контакты помощи
            </Button>
          ) : null}

          <div className="no-print flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy aria-hidden="true" className="h-4 w-4" />
              Скопировать текстом
            </Button>
            <Button variant="outline" size="sm" onClick={download}>
              <Download aria-hidden="true" className="h-4 w-4" />
              Скачать .txt
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer aria-hidden="true" className="h-4 w-4" />
              Печать
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Удалить результат" className="text-muted-foreground hover:text-destructive">
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Удалить
            </Button>
          </div>

          <p className="rounded-xl bg-surface p-4 text-xs leading-relaxed text-muted-foreground">
            {isComplete
              ? "Это результат самонаблюдения, а не медицинский диагноз. Обсудите его с врачом или психотерапевтом."
              : "Для этой записи недостаточно ответов: балл, категория и рекомендации не рассчитываются. Её можно удалить из истории."}
          </p>
        </div>
      ) : null}
    </li>
  );
}
