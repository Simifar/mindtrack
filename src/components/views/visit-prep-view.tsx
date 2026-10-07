"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { TextField, fieldClass } from "@/components/ui/field";
import { plural } from "@/lib/insights";
import { useToast } from "@/hooks/use-toast";
import { getCrisisPolicy } from "@/lib/crisis";
import { useAppStore } from "@/store/app-store";
import { clearVisitPrep, clearVisitPrepDraft, loadDiaryEntries, loadVisitPrep, loadVisitPrepDraft, saveVisitPrep, saveVisitPrepDraft, exportVisitText, type VisitPrep, type VisitPrepDraft } from "@/lib/clinical-notes";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { subscribeStorage } from "@/lib/storage/storage";

type DraftStatus = "loading" | "empty" | "pending" | "saved" | "error";

const DRAFT_STATUS_TEXT: Record<DraftStatus, string> = {
  loading: "Загружаем черновик…",
  empty: "Черновика пока нет.",
  pending: "Черновик сохраняется…",
  saved: "Черновик сохранён",
  error: "Не удалось сохранить черновик. Введённый текст пока остаётся в форме.",
};

function hasVisitContent(form: VisitPrep): boolean {
  return Object.entries(form).some(([key, value]) => key !== "visitDate" && key !== "updatedAt" && typeof value === "string" && value.trim().length > 0) || form.visitDate !== "";
}

function toVisitDraft(form: VisitPrep): VisitPrepDraft {
  const { updatedAt: _updatedAt, ...draft } = form;
  return draft;
}

type TextKey = Exclude<keyof VisitPrep, "visitDate" | "updatedAt">;

const SECTIONS: { id: string; title: string; keys: TextKey[] }[] = [
  { id: "visit-basics", title: "Основная информация", keys: ["priority", "changes", "episodes"] },
  { id: "visit-treatment", title: "Состояние и лечение", keys: ["sleep", "moodActivity", "currentMedication", "previousMedication", "substances", "health"] },
  { id: "visit-context", title: "Контекст и безопасность", keys: ["familyHistory", "safety", "other", "questions"] },
];

const TOTAL_FIELDS = SECTIONS.reduce((sum, section) => sum + section.keys.length, 0);

function filledCount(form: VisitPrep, keys: TextKey[]): number {
  return keys.filter((key) => form[key].trim().length > 0).length;
}

/** «сегодня», «завтра», «через 5 дней» — по календарным дням, без учёта времени суток. */
function describeVisitDate(value: string, now: Date): string | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((Date.UTC(year, month - 1, day) - today) / 86_400_000);
  if (days === 0) return "Приём сегодня";
  if (days === 1) return "Приём завтра";
  if (days > 1) return `Приём через ${days} ${plural(days, ["день", "дня", "дней"])}`;
  return "Дата приёма уже прошла";
}

const emptyForm: VisitPrep = {
  visitDate: "",
  priority: "",
  changes: "",
  episodes: "",
  sleep: "",
  moodActivity: "",
  currentMedication: "",
  previousMedication: "",
  health: "",
  familyHistory: "",
  substances: "",
  safety: "",
  other: "",
  questions: "",
  updatedAt: "",
};

export function VisitPrepView() {
  const { toast } = useToast();
  const setCrisisOpen = useAppStore((state) => state.setCrisisOpen);
  const [form, setForm] = useState<VisitPrep>(emptyForm);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("loading");
  const [hydrated, setHydrated] = useState(false);
  const [includeDiary, setIncludeDiary] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(emptyForm));
  const [hasSaved, setHasSaved] = useState(false);
  const draftEditedRef = useRef(false);
  const editedFieldsRef = useRef(new Set<keyof VisitPrep>());
  const [confirm, confirmDialog] = useConfirm();

  const isDirty = JSON.stringify(form) !== savedSnapshot;
  const filledTotal = SECTIONS.reduce((sum, section) => sum + filledCount(form, section.keys), 0);
  const visitWhen = hydrated && form.visitDate ? describeVisitDate(form.visitDate, new Date()) : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = loadVisitPrep();
      const draft = loadVisitPrepDraft();
      const restored = draft ? { ...saved, ...draft } : saved;
      setForm((current) => editedFieldsRef.current.size === 0
        ? restored
        : { ...restored, ...Object.fromEntries(Array.from(editedFieldsRef.current, (key) => [key, current[key]])) } as VisitPrep);
      setSavedSnapshot(JSON.stringify(saved));
      setHasSaved(Boolean(saved.updatedAt));
      setDraftStatus(draftEditedRef.current ? "pending" : draft ? "saved" : "empty");
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || !draftEditedRef.current) return;
    const timer = window.setTimeout(() => {
      try {
        if (hasVisitContent(form)) {
          saveVisitPrepDraft(toVisitDraft(form));
          setDraftStatus("saved");
        } else {
          clearVisitPrepDraft();
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
    if (draftEditedRef.current) return;
    if (event.key === STORAGE_KEYS.visitPrepDraft || event.key === STORAGE_KEYS.visitPrep) {
      const saved = loadVisitPrep();
      const draft = loadVisitPrepDraft();
      setForm(draft ? { ...saved, ...draft } : saved);
      setSavedSnapshot(JSON.stringify(saved));
      setHasSaved(Boolean(saved.updatedAt));
      setDraftStatus(draft ? "saved" : "empty");
    }
  }, [STORAGE_KEYS.visitPrepDraft, STORAGE_KEYS.visitPrep]), []);

  function update<K extends keyof VisitPrep>(key: K, value: VisitPrep[K]) {
    draftEditedRef.current = true;
    editedFieldsRef.current.add(key);
    setDraftStatus("pending");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    if (!isDirty) {
      toast({ title: "Изменений нет", description: "Сводка уже сохранена в этом браузере." });
      return;
    }
    try {
      saveVisitPrep(form);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось сохранить сводку", variant: "destructive" });
      return;
    }
    try {
      clearVisitPrepDraft();
    } catch {
      setDraftStatus("error");
      toast({ title: "Сводка сохранена, но черновик не удалён", description: "Попробуйте удалить его вручную.", variant: "destructive" });
      return;
    }
    draftEditedRef.current = false;
    const next = loadVisitPrep();
    setForm(next);
    setSavedSnapshot(JSON.stringify(next));
    setHasSaved(Boolean(next.updatedAt));
    setDraftStatus("empty");
    toast({ title: "Сводка сохранена" });
    const crisis = getCrisisPolicy("visit", form.safety);
    if (crisis.shouldOpenDialog) setCrisisOpen(true);
  }

  async function discardDraft() {
    const accepted = await confirm({
      title: "Удалить черновик?",
      description: hasSaved
        ? "Несохранённые изменения будут удалены, форма вернётся к сохранённой сводке."
        : "Введённый текст будет удалён из этого браузера.",
      confirmLabel: "Удалить черновик",
      destructive: true,
    });
    if (!accepted) return;
    try {
      clearVisitPrepDraft();
      draftEditedRef.current = false;
      const next = loadVisitPrep();
      setForm(next);
      setSavedSnapshot(JSON.stringify(next));
      setDraftStatus("empty");
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось удалить черновик", variant: "destructive" });
    }
  }

  async function deleteSavedSummary() {
    const accepted = await confirm({
      title: "Удалить сводку?",
      description: "Сохранённая сводка и её черновик будут удалены из этого браузера. Записи дневника останутся.",
      confirmLabel: "Удалить сводку",
      destructive: true,
    });
    if (!accepted) return;
    try {
      clearVisitPrep();
      clearVisitPrepDraft();
      draftEditedRef.current = false;
      setForm(emptyForm);
      setSavedSnapshot(JSON.stringify(emptyForm));
      setHasSaved(false);
      setDraftStatus("empty");
      toast({ title: "Сводка удалена" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось удалить сводку", variant: "destructive" });
    }
  }

  function download() {
    const text = exportVisitText(form, includeDiary ? loadDiaryEntries() : []);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mindtrack-podgotovka-k-priyomu.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Сводка скачана" });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        eyebrow="К врачу"
        title="Подготовка к приёму"
        description={
          <>
            <p>Структурируйте то, что важно рассказать новому психиатру, и возьмите сводку с собой.</p>
            <p className="mt-2 text-sm">
              Заполнять всё необязательно. Можно пропускать вопросы, на которые трудно отвечать или которыми вы пока не готовы делиться. Это рабочая заметка для разговора, не диагноз и не замена анкете специалиста.
            </p>
            <p className="mt-2 text-sm">
              Черновик формы сохраняется в этом браузере. Дневник не добавляется в файл автоматически: выберите эту опцию только если хотите включить последние наблюдения.
            </p>
          </>
        }
      />

      <nav aria-label="Разделы сводки" className="no-print rounded-2xl border border-border/80 bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
          <p className="font-medium">
            Заполнено <span className="tabular-nums">{filledTotal}</span> из{" "}
            <span className="tabular-nums">{TOTAL_FIELDS}</span> {plural(TOTAL_FIELDS, ["пункта", "пунктов", "пунктов"])}
          </p>
          <p className="text-xs text-muted-foreground">{visitWhen ?? "Дату приёма можно указать ниже"}</p>
        </div>
        <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
            style={{ width: `${(filledTotal / TOTAL_FIELDS) * 100}%` }}
          />
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-sm transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {section.title}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {filledCount(form, section.keys)}/{section.keys.length}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Card id="visit-basics" className="scroll-mt-24">
        <CardHeader><CardTitle as="h2" className="text-lg">Основная информация</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {DRAFT_STATUS_TEXT[draftStatus]} · Последнее сохранение: {form.updatedAt ? new Date(form.updatedAt).toLocaleString("ru-RU") : "ещё не сохраняли"}
          </p>
          <label className="block max-w-xs space-y-1.5 text-sm font-medium">
            <span>Дата приёма</span>
            <input type="date" className={fieldClass} value={form.visitDate} onChange={(event) => update("visitDate", event.target.value)} />
          </label>
          <TextField label="Что сейчас беспокоит сильнее всего" value={form.priority} onChange={(value) => update("priority", value)} hint="Коротко: симптомы, трудности, цель обращения и что хочется понять или изменить." />
          <TextField label="Что изменилось и когда" value={form.changes} onChange={(value) => update("changes", value)} placeholder="Когда началось, как менялось, что помогает или ухудшает" />
          <TextField label="Заметные эпизоды и их длительность" value={form.episodes} onChange={(value) => update("episodes", value)} rows={4} hint="Для каждого эпизода полезно указать примерные даты, сон, настроение, активность, импульсивность, влияние на работу/учёбу и обращение за помощью." />
        </CardContent>
      </Card>

      <Card id="visit-treatment" className="scroll-mt-24">
        <CardHeader><CardTitle as="h2" className="text-lg">Состояние и лечение</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextField label="Сон" value={form.sleep} onChange={(value) => update("sleep", value)} placeholder="Время сна и подъёма, пробуждения, изменения потребности во сне" />
          <TextField label="Настроение и активность" value={form.moodActivity} onChange={(value) => update("moodActivity", value)} placeholder="Настроение, энергия, темп мыслей/речи, раздражительность, заметные изменения поведения" />
          <TextField label="Текущие препараты" value={form.currentMedication} onChange={(value) => update("currentMedication", value)} rows={4} hint="Название, дозировка, когда начали, эффект, побочные эффекты, пропуски или самостоятельные изменения." />
          <TextField label="Предыдущие препараты и лечение" value={form.previousMedication} onChange={(value) => update("previousMedication", value)} placeholder="Что принимали, как долго, что помогло или почему отменили" />
          <TextField label="Алкоголь, кофеин и другие вещества" value={form.substances} onChange={(value) => update("substances", value)} placeholder="Что, как часто, примерно сколько и зачем употреблялось" />
          <TextField label="Здоровье и важные сведения" value={form.health} onChange={(value) => update("health", value)} placeholder="Диагнозы, травмы, операции, аллергии, гормональные или другие факторы, которые могут быть важны врачу" />
        </CardContent>
      </Card>

      <Card id="visit-context" className="scroll-mt-24">
        <CardHeader><CardTitle as="h2" className="text-lg">Контекст и безопасность</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <TextField label="Семейный анамнез" value={form.familyHistory} onChange={(value) => update("familyHistory", value)} rows={4} placeholder="Известные психические расстройства, зависимости, суициды или необычные периоды у близких — если это известно" />
          <TextField label="Мысли о смерти, самоповреждении или безопасности" value={form.safety} onChange={(value) => update("safety", value)} rows={4} hint="Можно указать, есть ли это сейчас, когда было в последний раз, насколько трудно контролировать и какая помощь нужна. При непосредственной опасности обращайтесь за экстренной помощью, а не ждите приёма." />
          <TextField label="Другое важное" value={form.other} onChange={(value) => update("other", value)} placeholder="То, что не вошло в предыдущие разделы" />
          <TextField label="Вопросы врачу" value={form.questions} onChange={(value) => update("questions", value)} rows={4} placeholder="Например: что отслеживать до следующего приёма? какие побочные эффекты считать поводом для связи? когда нужна срочная помощь?" />
        </CardContent>
      </Card>

      <label className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm">
        <input type="checkbox" checked={includeDiary} onChange={(event) => setIncludeDiary(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
        <span>
          <span className="font-medium">Добавить последние записи дневника в файл</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">В файл попадут дата, краткие шкалы и заметки за последние 14 записей.</span>
        </span>
      </label>

      <div className="no-print action-dock sticky z-20 -mx-2 flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-raised backdrop-blur">
        <Button onClick={save} variant={isDirty ? "default" : "outline"}>
          <Save aria-hidden="true" className="h-4 w-4" /> Сохранить
        </Button>
        {draftStatus !== "empty" && draftStatus !== "loading" ? (
          <Button variant="ghost" className="min-w-11" title="Удалить черновик" onClick={discardDraft}>
            <Trash2 aria-hidden="true" className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Удалить черновик</span>
          </Button>
        ) : null}
        <Button variant="ghost" className="min-w-11" title="Скачать сводку" onClick={download}>
          <Download aria-hidden="true" className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Скачать сводку</span>
        </Button>
        <Button variant="ghost" className="min-w-11" title="Печать" onClick={() => window.print()}>
          <Printer aria-hidden="true" className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Печать</span>
        </Button>
        <span aria-hidden="true" className="ml-auto hidden text-xs text-muted-foreground sm:block">
          {isDirty ? "Есть несохранённые изменения" : DRAFT_STATUS_TEXT[draftStatus]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-relaxed text-muted-foreground">
        <span>Перед отправкой файла врачу проверьте, нет ли в нём лишних личных данных.</span>
        {hasSaved ? (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 px-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-destructive"
            onClick={deleteSavedSummary}
          >
            Удалить сводку
          </Button>
        ) : null}
      </div>
      {confirmDialog}
    </div>
  );
}
