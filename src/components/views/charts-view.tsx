"use client";
import { useEffect, useMemo, useState } from "react";
import { api, type DashboardDTO } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LineChart as LineIcon, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Scatter,
} from "recharts";

type Metric = "mood" | "sleep" | "energy";

const METRIC_META: Record<Metric, { label: string; color: string; axis: "left" | "right" }> = {
  mood: { label: "Настроение (0–10)", color: "#10b981", axis: "left" },
  sleep: { label: "Сон (часы)", color: "#6366f1", axis: "right" },
  energy: { label: "Энергия (0–10)", color: "#f59e0b", axis: "left" },
};

export function ChartsView() {
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metric[]>(["mood", "sleep"]);

  useEffect(() => {
    api.dashboard
      .get()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.moodSeries.map((d) => ({
      date: new Date(d.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      mood: d.mood,
      sleep: d.sleepHours,
      energy: d.energyLevel,
      crisis: d.crisisDetected,
    }));
  }, [data]);

  const crisisPoints = chartData.filter((d) => d.crisis);

  if (loading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Графики и корреляции</h1>
        <p className="text-sm text-muted-foreground">
          Наложение метрик на одной шкале времени — ищите закономерности
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <LineIcon className="h-4 w-4" />
                Динамика метрик
              </CardTitle>
              <CardDescription>Выберите 2–3 метрики для сравнения</CardDescription>
            </div>
            <ToggleGroup
              type="multiple"
              value={metrics}
              onValueChange={(v) => setMetrics(v as Metric[])}
              className="flex-wrap"
            >
              {(Object.keys(METRIC_META) as Metric[]).map((m) => (
                <ToggleGroupItem
                  key={m}
                  value={m}
                  variant="outline"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {METRIC_META[m].label.split(" (")[0]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-8 w-8 opacity-40" />
              Недостаточно данных для графиков. Заполняйте дневник несколько дней.
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 12]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {metrics.includes("mood") && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="mood"
                      name={METRIC_META.mood.label}
                      stroke={METRIC_META.mood.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                  {metrics.includes("energy") && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="energy"
                      name={METRIC_META.energy.label}
                      stroke={METRIC_META.energy.color}
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      dot={{ r: 3 }}
                    />
                  )}
                  {metrics.includes("sleep") && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="sleep"
                      name={METRIC_META.sleep.label}
                      stroke={METRIC_META.sleep.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                  {crisisPoints.length > 0 && (
                    <Scatter
                      yAxisId="left"
                      dataKey="crisis"
                      data={crisisPoints}
                      name="Кризисные записи"
                      fill="#ef4444"
                      shape="star"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Как читать график</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Настроение и энергия</span> — левая шкала
            (0–10). <span className="font-medium text-foreground">Сон</span> — правая шкала (часы).
          </p>
          <p>
            Красные звёзды — дни с кризисными записями. Обратите внимание, что предшествовало им
            (например, недосып → падение настроения).
          </p>
          <p className="rounded-lg bg-muted/50 p-3 text-xs">
            Корреляция ≠ причинность. Графики помогают заметить паттерны, а выводы обсуждаются со
            специалистом.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
