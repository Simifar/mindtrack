"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardPenLine, Download, Printer, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getCrisisPolicy } from "@/lib/crisis";
import { useAppStore } from "@/store/app-store";
import { clearVisitPrep, clearVisitPrepDraft, loadDiaryEntries, loadVisitPrep, loadVisitPrepDraft, saveVisitPrep, saveVisitPrepDraft, exportVisitText, type VisitPrep, type VisitPrepDraft } from "@/lib/clinical-notes";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { subscribeStorage } from "@/lib/storage/storage";

const fieldClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

type DraftStatus = "loading" | "empty" | "pending" | "saved" | "error";

function hasVisitContent(form: VisitPrep): boolean {
  return Object.entries(form).some(([key, value]) => key !== "visitDate" && key !== "updatedAt" && typeof value === "string" && value.trim().length > 0) || form.visitDate !== "";
}

function toVisitDraft(form: VisitPrep): VisitPrepDraft {
  const { updatedAt: _updatedAt, ...draft } = form;
  return draft;
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

function TextField({ label, value, onChange, hint, placeholder, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; hint?: string; placeholder?: string; rows?: number }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      <textarea className={`${fieldClass} resize-y`} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function VisitPrepView() {
  const { toast } = useToast();
  const setCrisisOpen = useAppStore((state) => state.setCrisisOpen);
  const [form, setForm] = useState<VisitPrep>(emptyForm);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("loading");
  const [hydrated, setHydrated] = useState(false);
  const [includeDiary, setIncludeDiary] = useState(false);
  const draftEditedRef = useRef(false);
  const editedFieldsRef = useRef(new Set<keyof VisitPrep>());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = loadVisitPrep();
      const draft = loadVisitPrepDraft();
      const restored = draft ? { ...saved, ...draft } : saved;
      setForm((current) => editedFieldsRef.current.size === 0
        ? restored
        : { ...restored, ...Object.fromEntries(Array.from(editedFieldsRef.current, (key) => [key, current[key]])) } as VisitPrep);
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
    setForm(loadVisitPrep());
    setDraftStatus("empty");
    toast({ title: "Сводка сохранена" });
    const crisis = getCrisisPolicy("visit", form.safety);
    if (crisis.shouldOpenDialog) setCrisisOpen(true);
  }

  function discardDraft() {
    if (!window.confirm("Удалить незаписанный черновик? Сохранённая сводка останется.")) return;
    try {
      clearVisitPrepDraft();
      draftEditedRef.current = false;
      setForm(loadVisitPrep());
      setDraftStatus("empty");
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось удалить черновик", variant: "destructive" });
    }
  }

  function deleteSavedSummary() {
    if (!window.confirm("Удалить сохранённую сводку и её черновик?")) return;
    try {
      clearVisitPrep();
      clearVisitPrepDraft();
      draftEditedRef.current = false;
      setForm(emptyForm);
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
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><ClipboardPenLine className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Подготовка к приёму</h1>
          <p className="mt-1 text-sm text-muted-foreground">Структурируйте то, что важно рассказать новому психиатру, и возьмите сводку с собой.</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
          <p>Заполнять всё необязательно. Можно пропускать вопросы, на которые трудно отвечать или которыми вы пока не готовы делиться. Это рабочая заметка для разговора, не диагноз и не замена анкете специалиста.</p>
          <p>Черновик формы сохраняется в этом браузере. Дневник не добавляется в файл автоматически: выберите эту опцию только если хотите включить последние наблюдения.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Основная информация</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {draftStatus === "loading" ? "Загружаем черновик…" : draftStatus === "pending" ? "Черновик сохраняется…" : draftStatus === "saved" ? "Черновик сохранён" : draftStatus === "error" ? "Не удалось сохранить черновик. Введённый текст пока остаётся в форме." : "Черновика пока нет."}
          </p>
          <label className="block max-w-xs space-y-1.5 text-sm font-medium"><span>Дата приёма</span><input type="date" className={fieldClass} value={form.visitDate} onChange={(event) => update("visitDate", event.target.value)} /></label>
          <TextField label="Что сейчас беспокоит сильнее всего" value={form.priority} onChange={(value) => update("priority", value)} hint="Коротко: симптомы, трудности, цель обращения и что хочется понять или изменить." />
          <TextField label="Что изменилось и когда" value={form.changes} onChange={(value) => update("changes", value)} placeholder="Когда началось, как менялось, что помогает или ухудшает" />
          <TextField label="Заметные эпизоды и их длительность" value={form.episodes} onChange={(value) => update("episodes", value)} hint="Для каждого эпизода полезно указать примерные даты, сон, настроение, активность, импульсивность, влияние на работу/учёбу и обращение за помощью." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Состояние и лечение</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextField label="Сон" value={form.sleep} onChange={(value) => update("sleep", value)} placeholder="Время сна и подъёма, пробуждения, изменения потребности во сне" />
          <TextField label="Настроение и активность" value={form.moodActivity} onChange={(value) => update("moodActivity", value)} placeholder="Настроение, энергия, темп мыслей/речи, раздражительность, заметные изменения поведения" />
          <TextField label="Текущие препараты" value={form.currentMedication} onChange={(value) => update("currentMedication", value)} hint="Название, дозировка, когда начали, эффект, побочные эффекты, пропуски или самостоятельные изменения." />
          <TextField label="Предыдущие препараты и лечение" value={form.previousMedication} onChange={(value) => update("previousMedication", value)} placeholder="Что принимали, как долго, что помогло или почему отменили" />
          <TextField label="Алкоголь, кофеин и другие вещества" value={form.substances} onChange={(value) => update("substances", value)} placeholder="Что, как часто, примерно сколько и зачем употреблялось" />
          <TextField label="Здоровье и важные сведения" value={form.health} onChange={(value) => update("health", value)} placeholder="Диагнозы, травмы, операции, аллергии, гормональные или другие факторы, которые могут быть важны врачу" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Контекст и безопасность</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <TextField label="Семейный анамнез" value={form.familyHistory} onChange={(value) => update("familyHistory", value)} placeholder="Известные психические расстройства, зависимости, суициды или необычные периоды у близких — если это известно" />
          <TextField label="Мысли о смерти, самоповреждении или безопасности" value={form.safety} onChange={(value) => update("safety", value)} hint="Можно указать, есть ли это сейчас, когда было в последний раз, насколько трудно контролировать и какая помощь нужна. При непосредственной опасности обращайтесь за экстренной помощью, а не ждите приёма." />
          <TextField label="Другое важное" value={form.other} onChange={(value) => update("other", value)} placeholder="То, что не вошло в предыдущие разделы" />
          <TextField label="Вопросы врачу" value={form.questions} onChange={(value) => update("questions", value)} placeholder="Например: что отслеживать до следующего приёма? какие побочные эффекты считать поводом для связи? когда нужна срочная помощь?" />
        </CardContent>
      </Card>

      <label className="flex items-start gap-3 rounded-xl border bg-card p-4 text-sm">
        <input type="checkbox" checked={includeDiary} onChange={(event) => setIncludeDiary(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
        <span><span className="font-medium">Добавить последние записи дневника в файл</span><span className="mt-1 block text-xs text-muted-foreground">В файл попадут дата, краткие шкалы и заметки за последние 14 записей.</span></span>
      </label>
      <div className="no-print flex flex-wrap gap-2">
        <Button onClick={save}><Save className="h-4 w-4" /> Сохранить</Button>
        {draftStatus !== "empty" && draftStatus !== "loading" && <Button variant="outline" onClick={discardDraft}><Trash2 className="h-4 w-4" /> Удалить черновик</Button>}
        <Button variant="outline" onClick={download}><Download className="h-4 w-4" /> Скачать сводку</Button>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Печать</Button>
        <Button variant="outline" onClick={deleteSavedSummary}><Trash2 className="h-4 w-4" /> Удалить сводку</Button>
      </div>
      <p className="text-xs text-muted-foreground">Последнее сохранение: {form.updatedAt ? new Date(form.updatedAt).toLocaleString("ru-RU") : "ещё не сохраняли"}. Перед отправкой файла врачу проверьте, нет ли в нём лишних личных данных.</p>
    </div>
  );
}
