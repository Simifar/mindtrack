"use client";
import { useEffect, useMemo, useState } from "react";
import { api, type DiaryEntryDTO } from "@/lib/api-client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { CRISIS_RESOURCES } from "@/lib/crisis";

function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

const MOOD_LABELS: Record<number, string> = {
  0: "Очень плохо",
  2: "Плохо",
  4: "Так себе",
  5: "Нормально",
  7: "Хорошо",
  9: "Отлично",
  10: "Превосходно",
};

export function DiaryView() {
  const [date, setDate] = useState(todayISO());
  const [mood, setMood] = useState(5);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [notes, setNotes] = useState("");
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<DiaryEntryDTO[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [crisisHint, setCrisisHint] = useState(false);
  const setCrisisOpen = useAppStore((s) => s.setCrisisOpen);
  const { toast } = useToast();

  // Загрузка записи на выбранную дату.
  useEffect(() => {
    setLoadingEntry(true);
    api.diary
      .get(date)
      .then(({ entry }) => {
        if (entry) {
          setMood(entry.mood);
          setSleepHours(entry.sleepHours ?? 7);
          setEnergyLevel(entry.energyLevel ?? 5);
          setNotes(entry.notes ?? "");
        } else {
          setMood(5);
          setSleepHours(7);
          setEnergyLevel(5);
          setNotes("");
        }
      })
      .finally(() => setLoadingEntry(false));
  }, [date]);

  // Загрузка списка за 30 дней.
  useEffect(() => {
    const to = todayISO();
    const from = todayISO(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    api.diary
      .list(from, to)
      .then(({ items }) => setList(items))
      .finally(() => setLoadingList(false));
  }, [date]);

  // Простейшая локальная подсказка кризиса (без отправки).
  useEffect(() => {
    const t = setTimeout(() => {
      setCrisisHint(/суицид|не хочу жить|покончить|причинить себе вред|хочу умереть|режу себя/i.test(notes));
    }, 400);
    return () => clearTimeout(t);
  }, [notes]);

  function shiftDate(days: number) {
    const d = new Date(date + "T12:00:00.000Z");
    d.setDate(d.getDate() + days);
    setDate(todayISO(d));
  }

  async function save() {
    setSaving(true);
    try {
      const { entry } = await api.diary.save({
        date,
        mood,
        sleepHours,
        energyLevel,
        notes,
      });
      setList((prev) => {
        const filtered = prev.filter((e) => todayISO(new Date(e.date)) !== date);
        return [entry, ...filtered];
      });
      toast({ title: "Запись сохранена", description: new Date(entry.date).toLocaleDateString("ru-RU") });
      if (entry.crisisDetected) {
        setCrisisOpen(true);
      }
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Дневник</h1>
          <p className="text-sm text-muted-foreground">Быстрая запись состояния — до 30 секунд</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Запись дня
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => shiftDate(-1)} aria-label="Назад">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-36"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shiftDate(1)}
                disabled={date >= todayISO()}
                aria-label="Вперёд"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {loadingEntry ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <>
              {/* Настроение */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Настроение</Label>
                  <span className="text-sm font-medium" style={{ color: "var(--chart-2)" }}>
                    {mood}/10 — {MOOD_LABELS[mood] ?? ""}
                  </span>
                </div>
                <Slider
                  value={[mood]}
                  onValueChange={([v]) => setMood(v)}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>

              {/* Сон */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Сон, часов</Label>
                  <span className="text-sm font-medium" style={{ color: "var(--chart-4)" }}>
                    {sleepHours} ч
                  </span>
                </div>
                <Slider
                  value={[sleepHours]}
                  onValueChange={([v]) => setSleepHours(v)}
                  min={0}
                  max={12}
                  step={0.5}
                />
              </div>

              {/* Энергия */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Уровень энергии</Label>
                  <span className="text-sm font-medium" style={{ color: "var(--chart-5)" }}>
                    {energyLevel}/10
                  </span>
                </div>
                <Slider
                  value={[energyLevel]}
                  onValueChange={([v]) => setEnergyLevel(v)}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>

              {/* Заметка */}
              <div className="space-y-2">
                <Label>Заметка (необязательно)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Что произошло, что почувствовали, что помогло / помешало..."
                  rows={3}
                  maxLength={5000}
                />
                {crisisHint && (
                  <div className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
                    <p className="font-medium">{CRISIS_RESOURCES.title}</p>
                    <p className="mt-1 text-xs">{CRISIS_RESOURCES.body}</p>
                    <a
                      href={CRISIS_RESOURCES.lines[0].href}
                      className="mt-1 inline-block font-mono font-semibold"
                    >
                      {CRISIS_RESOURCES.lines[0].phone}
                    </a>
                  </div>
                )}
              </div>

              <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Сохранить запись
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* История */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">История за 30 дней</CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          {loadingList ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Записей пока нет. Добавьте первую выше.
            </p>
          ) : (
            <div className="space-y-2">
              {list.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setDate(todayISO(new Date(e.date)))}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-accent"
                >
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
                    <span className="text-[10px] leading-none text-muted-foreground">
                      {new Date(e.date).toLocaleDateString("ru-RU", { month: "short" })}
                    </span>
                    <span className="text-sm font-bold leading-none">
                      {new Date(e.date).getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-emerald-700">
                        😊 {e.mood}
                      </Badge>
                      {e.sleepHours !== null && (
                        <Badge variant="outline" className="text-indigo-700">
                          😴 {e.sleepHours}ч
                        </Badge>
                      )}
                      {e.energyLevel !== null && (
                        <Badge variant="outline" className="text-amber-700">
                          ⚡ {e.energyLevel}
                        </Badge>
                      )}
                      {e.crisisDetected && (
                        <Badge variant="outline" className="border-orange-300 text-orange-700">
                          помощь
                        </Badge>
                      )}
                    </div>
                    {e.notes && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{e.notes}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
