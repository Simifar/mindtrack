"use client";

import { useEffect, useState } from "react";
import { BookHeart, Download, Printer, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app-store";
import { detectCrisis } from "@/lib/crisis";
import { deleteDiaryEntry, exportDiaryJson, loadDiaryEntries, saveDiaryEntry, type DiaryEntry } from "@/lib/clinical-notes";

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

const fieldClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

function RangeField({ label, value, onChange, hint }: { label: string; value: number; onChange: (value: number) => void; hint?: string }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="flex items-center justify-between gap-2 font-medium">
        <span>{label}</span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums">{value}/10</span>
      </span>
      <input type="range" min="0" max="10" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-primary" />
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      <textarea className={`${fieldClass} resize-y`} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function DiaryView() {
  const { toast } = useToast();
  const setCrisisOpen = useAppStore((state) => state.setCrisisOpen);
  const [form, setForm] = useState<DiaryForm>(initialForm);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEntries(loadDiaryEntries());
      setForm((current) => current.date ? current : { ...current, date: localDate() });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function update<K extends keyof DiaryForm>(key: K, value: DiaryForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    const entry: DiaryEntry = { ...form, id: `${form.date}-${Date.now()}`, createdAt: new Date().toISOString() };
    try {
      saveDiaryEntry(entry);
      setEntries(loadDiaryEntries());
      toast({ title: "Запись сохранена" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось сохранить запись", variant: "destructive" });
      return;
    }
    const crisis = detectCrisis(`${form.warningSigns}\n${form.notes}`);
    if (crisis.detected) setCrisisOpen(true);
  }

  function removeEntry(id: string) {
    try {
      deleteDiaryEntry(id);
      setEntries(loadDiaryEntries());
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Не удалось удалить запись", variant: "destructive" });
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

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><BookHeart className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Дневник состояния</h1>
          <p className="mt-1 text-sm text-muted-foreground">Настроение, сон, активность и факторы дня — чтобы обсуждать динамику со специалистом.</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Заполняйте один раз в день, ориентируясь на день в целом. Шкалы 0–10 — только способ заметить динамику, не диагноз и не оценка «правильности» состояния. Данные хранятся только в этом браузере.
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Запись за день</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <label className="block max-w-xs space-y-1.5 text-sm font-medium">
            <span>Дата</span>
            <input type="date" className={fieldClass} value={form.date} onChange={(event) => update("date", event.target.value)} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <RangeField label="Настроение" value={form.mood} onChange={(value) => update("mood", value)} hint="0 — очень тяжело, 5 — примерно обычно, 10 — необычно высоко" />
            <label className="space-y-1.5 text-sm"><span className="font-medium">Сон, часов</span><input type="number" min="0" max="24" step="0.5" className={fieldClass} value={form.sleepHours} onChange={(event) => update("sleepHours", event.target.value)} placeholder="например, 7,5" /></label>
            <RangeField label="Качество сна" value={form.sleepQuality} onChange={(value) => update("sleepQuality", value)} />
            <RangeField label="Энергия" value={form.energy} onChange={(value) => update("energy", value)} />
            <RangeField label="Тревога" value={form.anxiety} onChange={(value) => update("anxiety", value)} />
            <RangeField label="Раздражительность" value={form.irritability} onChange={(value) => update("irritability", value)} />
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
          <div className="flex flex-wrap gap-2">
            <Button onClick={save}><Save className="h-4 w-4" /> Сохранить запись</Button>
            <Button variant="outline" onClick={downloadJson}><Download className="h-4 w-4" /> Экспорт JSON</Button>
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Печать</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Последние записи</CardTitle></CardHeader>
        <CardContent>
          {entries.length === 0 ? <p className="text-sm text-muted-foreground">Здесь появятся сохранённые записи.</p> : (
            <div className="space-y-3">
              {entries.slice(0, 30).map((entry) => (
                <div key={entry.id} className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{new Date(`${entry.date}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</div>
                    <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)}><Trash2 className="h-4 w-4" /> Удалить</Button>
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                    <span>Настроение: <b className="text-foreground">{entry.mood}/10</b></span>
                    <span>Сон: <b className="text-foreground">{entry.sleepHours || "—"} ч</b></span>
                    <span>Энергия: <b className="text-foreground">{entry.energy}/10</b></span>
                    <span>Тревога: <b className="text-foreground">{entry.anxiety}/10</b></span>
                  </div>
                  {(entry.notes || entry.warningSigns) && <p className="mt-2 whitespace-pre-wrap text-sm">{entry.warningSigns || entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
