"use client";

import { useEffect, useRef, useState } from "react";
import { BookHeart, Download, Printer, Save, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/app/page-header";
import { TrendChart } from "@/components/app/trend-chart";
import { RangeField, TextField, fieldClass } from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app-store";
import { getCrisisPolicy } from "@/lib/crisis";
import { clearDiaryDraft, deleteDiaryEntry, exportDiaryJson, loadDiaryDraft, loadDiaryEntries, saveDiaryDraft, saveDiaryEntry, type DiaryEntry } from "@/lib/clinical-notes";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { subscribeStorage } from "@/lib/storage/storage";

type DiaryForm = Omit<DiaryEntry, "id" | "createdAt">;

function localDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const initialForm: DiaryForm = {
  date: "",
  mood: 5,
  sleepHours: "",
  sleepQuality: 5,
  energy: 5,
  anxiety: 0,
  irritability: 0,
  activity: "",
  medication: "",
  substances: "",
  stressors: "",
  helpful: "",
  warningSigns: "",
  notes: "",
};

type DraftStatus = "loading" | "empty" | "pending" | "saved" | "error";

const DRAFT_STATUS_TEXT: Record<DraftStatus, string> = {
  loading: "Загружаем черновик…",
  empty: "Черновика пока нет.",
  pending: "Черновик сохраняется…",
  saved: "Черновик сохранён",
  error: "Не удалось сохранить черновик. Введённый текст пока остаётся в форме.",
};

const ENTRY_LIMIT = 30;

function hasDiaryContent(form: DiaryForm): boolean {
  return form.mood !== 5 || form.sleepHours !== "" || form.sleepQuality !== 5 || form.energy !== 5 ||
    form.anxiety !== 0 || form.irritability !== 0 || [form.activity, form.medication, form.substances, form.stressors, form.helpful, form.warningSigns, form.notes].some((value) => value.trim().length > 0);
}

function blankForm(): DiaryForm {
  return { ...initialForm, date: localDate() };
}

function sanitizeHours(value: string): string {
  return value.replace(/[^\d.,]/g, "").slice(0, 5);
}

function allTouched(): Set<keyof DiaryForm> {
  return new Set(Object.keys(initialForm) as (keyof DiaryForm)[]);
}

export function DiaryView() {
  const { toast } = useToast();
  const setCrisisOpen = useAppStore((state) => state.setCrisisOpen);
  const [form, setForm] = useState<DiaryForm>(initialForm);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("loading");
  const [hydrated, setHydrated] = useState(false);
  const [touched, setTouched] = useState<Set<keyof DiaryForm>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<DiaryEntry | null>(null);
  const draftEditedRef = useRef(false);
  const editedFieldsRef = useRef(new Set<keyof DiaryForm>());
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEntries(loadDiaryEntries());
      const draft = loadDiaryDraft();
      const restored = draft ?? blankForm();
      setForm((current) => editedFieldsRef.current.size === 0
        ? restored
        : { ...restored, ...Object.fromEntries(Array.from(editedFieldsRef.current, (key) => [key, current[key]])) } as DiaryForm);
      if (draft) setTouched(allTouched());
      setDraftStatus(draftEditedRef.current ? "pending" : draft ? "saved" : "empty");
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || !draftEditedRef.current) return;
    const timer = window.setTimeout(() => {
      try {
        if (hasDiaryContent(form)) {
          saveDiaryDraft(form);
          setDraftStatus("saved");
        } else {
          clearDiaryDraft();
          setDraftStatus("empty");
        }
        draftEditedRef.current = false;
      } catch {
        setDraftStatus("error");
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, hydrated]);

  useEffect(() => subscribeStorage((event) => {
    if (event.key === STORAGE_KEYS.diary) setEntries(loadDiaryEntries());
    if (event.key === STORAGE_KEYS.diaryDraft && !draftEditedRef.current) {
      const draft = loadDiaryDraft();
      if (draft) {
        setForm(draft);
        setTouched(allTouched());
        setDraftStatus("saved");
      } else if (event.newValue === null) {
        setForm(blankForm());
        setTouched(new Set());
        setDraftStatus("empty");
      }
    }
  }, [STORAGE_KEYS.diary, STORAGE_KEYS.diaryDraft]), []);

  useEffect(() => {
    if (!lastDeleted) return;
    const timer = window.setTimeout(() => setLastDeleted(null), 12_000);
    return () => window.clearTimeout(timer);
  }, [lastDeleted]);

  function update<K extends keyof DiaryForm>(key: K, value: DiaryForm[K]) {
    draftEditedRef.current = true;
    editedFieldsRef.current.add(key);
    setTouched((current) => new Set(current).add(key));
    setDraftStatus("pending");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    const entry: DiaryEntry = { ...form, id: `${form.date}-${Date.now()}`, createdAt: new Date().toISOString() };
    try {
      saveDiaryEntry(entry);
      setEntries(loadDiaryEntries());
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось сохранить запись", variant: "destructive" });
      return;
    }
    try {
      clearDiaryDraft();
    } catch {
      setDraftStatus("error");
      toast({ title: "Запись сохранена, но черновик не удалён", description: "Попробуйте удалить его вручную.", variant: "destructive" });
      return;
    }
    draftEditedRef.current = false;
    setForm(blankForm());
    setTouched(new Set());
    setDraftStatus("empty");
    toast({ title: "Запись сохранена" });
    const crisis = getCrisisPolicy("diary", `${form.warningSigns}\n${form.notes}`);
    if (crisis.shouldOpenDialog) setCrisisOpen(true);
  }

  async function discardDraft() {
    const accepted = await confirm({
      title: "Удалить черновик?",
      description: "Незаписанные изменения в форме будут удалены. Сохранённые записи останутся.",
      confirmLabel: "Удалить черновик",
      destructive: true,
    });
    if (!accepted) return;
    try {
      clearDiaryDraft();
      draftEditedRef.current = false;
      setForm(blankForm());
      setTouched(new Set());
      setDraftStatus("empty");
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось удалить черновик", variant: "destructive" });
    }
  }

  function removeEntry(id: string) {
    const removed = entries.find((entry) => entry.id === id) ?? null;
    try {
      deleteDiaryEntry(id);
      setEntries(loadDiaryEntries());
      setLastDeleted(removed);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось удалить запись", variant: "destructive" });
    }
  }

  function undoRemove() {
    if (!lastDeleted) return;
    try {
      saveDiaryEntry(lastDeleted);
      setEntries(loadDiaryEntries());
      setLastDeleted(null);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось вернуть запись", variant: "destructive" });
    }
  }

  function downloadJson() {
    const blob = new Blob([exportDiaryJson()], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mindtrack-diary-${localDate()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Дневник скачан" });
  }

  const visibleEntries = showAll ? entries : entries.slice(0, ENTRY_LIMIT);
  // Для графика берём последнюю запись за каждый день, от старых к новым.
  const moodByDay = new Map<string, DiaryEntry>();
  for (const entry of entries) if (!moodByDay.has(entry.date)) moodByDay.set(entry.date, entry);
  const moodPoints = Array.from(moodByDay.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((entry) => ({ id: entry.id, dateISO: `${entry.date}T12:00:00`, value: entry.mood }));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        eyebrow="Самонаблюдение"
        title="Дневник состояния"
        description={
          <>
            <p>Настроение, сон, активность и факторы дня — чтобы обсуждать динамику со специалистом.</p>
            <p className="mt-2 text-sm">
              Шкалы 0–10 — способ заметить изменения, а не диагноз и не оценка «правильности» состояния. Незаписанный текст сохраняется в этом браузере; отдельную запись создаёт кнопка «Сохранить запись».
            </p>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-lg">Запись за день</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {DRAFT_STATUS_TEXT[draftStatus]}
          </p>

          <label className="block max-w-xs space-y-1.5 text-sm">
            <span className="font-medium">Дата</span>
            <input type="date" className={fieldClass} value={form.date} onChange={(event) => update("date", event.target.value)} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <RangeField
              label="Настроение"
              value={form.mood}
              touched={touched.has("mood")}
              onChange={(value) => update("mood", value)}
              hint="0 — очень тяжело, 5 — примерно обычно, 10 — необычно высоко"
            />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Сон, часов</span>
              <input
                type="text"
                inputMode="decimal"
                className={fieldClass}
                value={form.sleepHours}
                onChange={(event) => update("sleepHours", sanitizeHours(event.target.value))}
                placeholder="например, 7,5"
              />
            </label>
            <RangeField label="Качество сна" value={form.sleepQuality} touched={touched.has("sleepQuality")} onChange={(value) => update("sleepQuality", value)} startLabel="очень плохо" endLabel="очень хорошо" />
            <RangeField label="Энергия" value={form.energy} touched={touched.has("energy")} onChange={(value) => update("energy", value)} startLabel="нет сил" endLabel="много сил" />
            <RangeField label="Тревога" value={form.anxiety} touched={touched.has("anxiety")} onChange={(value) => update("anxiety", value)} startLabel="спокойно" endLabel="очень сильная" />
            <RangeField label="Раздражительность" value={form.irritability} touched={touched.has("irritability")} onChange={(value) => update("irritability", value)} startLabel="нет" endLabel="очень сильная" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Активность и функционирование" value={form.activity} onChange={(value) => update("activity", value)} placeholder="Что получилось делать, что было трудно, заметные изменения темпа" />
            <TextField label="Препараты" value={form.medication} onChange={(value) => update("medication", value)} placeholder="Приняты как обычно / пропуск / самостоятельное изменение — без самокритики" />
            <TextField label="Кофеин, алкоголь и другие вещества" value={form.substances} onChange={(value) => update("substances", value)} placeholder="Что и примерно сколько" />
            <TextField label="События или стрессоры" value={form.stressors} onChange={(value) => update("stressors", value)} placeholder="События, конфликты, нагрузка, изменения режима" />
            <TextField label="Что помогло" value={form.helpful} onChange={(value) => update("helpful", value)} placeholder="Поддержка, отдых, навыки, привычный режим" />
            <TextField label="Ранние признаки или важные изменения" value={form.warningSigns} onChange={(value) => update("warningSigns", value)} placeholder="Что отличается от обычного состояния" />
          </div>
          <TextField label="Комментарий" value={form.notes} onChange={(value) => update("notes", value)} placeholder="Дополнительные детали для обсуждения с врачом" />

          <div className="no-print action-dock sticky z-20 -mx-2 flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-raised backdrop-blur">
            <Button onClick={save} aria-label="Сохранить запись">
              <Save aria-hidden="true" className="h-4 w-4" /> Сохранить<span className="hidden sm:inline">&nbsp;запись</span>
            </Button>
            {draftStatus !== "empty" && draftStatus !== "loading" ? (
              <Button variant="outline" className="min-w-11" title="Удалить черновик" onClick={discardDraft}>
                <Trash2 aria-hidden="true" className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Удалить черновик</span>
              </Button>
            ) : null}
            <Button variant="ghost" className="min-w-11" title="Экспорт JSON" onClick={downloadJson}>
              <Download aria-hidden="true" className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Экспорт JSON</span>
            </Button>
            <Button variant="ghost" className="min-w-11" title="Печать" onClick={() => window.print()}>
              <Printer aria-hidden="true" className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Печать</span>
            </Button>
            <span aria-hidden="true" className="ml-auto hidden text-xs text-muted-foreground sm:block">
              {DRAFT_STATUS_TEXT[draftStatus]}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-lg">Последние записи</CardTitle>
          {entries.length > 0 ? (
            <p className="text-xs tabular-nums text-muted-foreground">
              {showAll || entries.length <= ENTRY_LIMIT
                ? `Всего записей: ${entries.length}`
                : `Показано ${ENTRY_LIMIT} из ${entries.length}`}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {moodPoints.length >= 2 ? (
            <div className="rounded-xl bg-surface p-4">
              <p className="mb-3 text-sm font-medium">Настроение по дням</p>
              <TrendChart title="Настроение по дням, шкала 0–10" points={moodPoints} max={10} unit="по шкале настроения" />
            </div>
          ) : null}

          {lastDeleted ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/50 p-3 text-sm">
              <span>Запись удалена.</span>
              <Button variant="ghost" size="sm" onClick={undoRemove}>
                <Undo2 aria-hidden="true" className="h-4 w-4" /> Вернуть
              </Button>
            </div>
          ) : null}

          {entries.length === 0 ? (
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
              <BookHeart aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>Записей пока нет. Заполните дату и шкалы выше — запись появится здесь и её можно будет включить в подготовку к приёму.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visibleEntries.map((entry) => (
                <li key={entry.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium tabular-nums">
                      {new Date(`${entry.date}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 aria-hidden="true" className="h-4 w-4" /> Удалить
                    </Button>
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                    <div>
                      <dt className="text-xs">Настроение</dt>
                      <dd className="font-medium tabular-nums text-foreground">{entry.mood}/10</dd>
                    </div>
                    <div>
                      <dt className="text-xs">Сон</dt>
                      <dd className="font-medium tabular-nums text-foreground">{entry.sleepHours || "—"} ч</dd>
                    </div>
                    <div>
                      <dt className="text-xs">Энергия</dt>
                      <dd className="font-medium tabular-nums text-foreground">{entry.energy}/10</dd>
                    </div>
                    <div>
                      <dt className="text-xs">Тревога</dt>
                      <dd className="font-medium tabular-nums text-foreground">{entry.anxiety}/10</dd>
                    </div>
                  </dl>
                  {entry.warningSigns ? (
                    <p className="mt-3 text-sm leading-relaxed">
                      <span className="text-muted-foreground">Ранние признаки: </span>
                      <span className="whitespace-pre-wrap">{entry.warningSigns}</span>
                    </p>
                  ) : null}
                  {entry.notes ? (
                    <p className="mt-2 text-sm leading-relaxed">
                      <span className="text-muted-foreground">Комментарий: </span>
                      <span className="whitespace-pre-wrap">{entry.notes}</span>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {entries.length > visibleEntries.length ? (
            <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
              Показать все записи ({entries.length})
            </Button>
          ) : null}
        </CardContent>
      </Card>
      {confirmDialog}
    </div>
  );
}
