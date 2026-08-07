"use client";
import { useEffect, useState } from "react";
import { api, type DashboardDTO } from "@/lib/api-client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Moon, Activity, ClipboardCheck, AlertCircle, Plus } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { severityColor } from "@/lib/test-scoring";

export function DashboardView() {
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const setView = useAppStore((s) => s.setView);
  const openTest = useAppStore((s) => s.openTest);

  useEffect(() => {
    api.dashboard
      .get()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }
  if (!data) return null;

  const chartData = data.moodSeries.map((d) => ({
    date: new Date(d.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    mood: d.mood,
    sleep: d.sleepHours,
    energy: d.energyLevel,
  }));

  const dueReminders = data.reminders.filter((r) => r.due);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
          <p className="text-sm text-muted-foreground">Обзор вашего состояния за 30 дней</p>
        </div>
        <Button onClick={() => setView("diary")}>
          <Plus className="h-4 w-4" />
          Запись дня
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Среднее настроение"
          value={data.stats.avgMood ?? "—"}
          suffix="/ 10"
          color="text-emerald-600"
        />
        <StatCard
          icon={<Moon className="h-4 w-4" />}
          label="Средний сон"
          value={data.stats.avgSleep ?? "—"}
          suffix=" ч"
          color="text-indigo-600"
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Дней с записями"
          value={data.stats.diaryDays}
          color="text-amber-600"
        />
        <StatCard
          icon={<ClipboardCheck className="h-4 w-4" />}
          label="Пройдено тестов"
          value={data.stats.totalTests}
          color="text-rose-600"
        />
      </div>

      {/* Reminders */}
      {dueReminders.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-900">
              <AlertCircle className="h-4 w-4" />
              Рекомендуем пройти
            </CardTitle>
            <CardDescription className="text-amber-800">
              Эти тесты давно не обновлялись
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {dueReminders.map((r) => (
              <Button
                key={r.id}
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => openTest(r.id)}
              >
                {r.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  каждые {r.periodicityDays} дн.
                </Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mood chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Настроение за 30 дней</CardTitle>
          <CardDescription>Зелёная линия — настроение (0–10)</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Moon className="h-8 w-8 opacity-40" />
              Пока нет записей. Добавьте первую запись дня.
              <Button size="sm" variant="outline" onClick={() => setView("diary")} className="mt-1">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#moodGrad)"
                    name="Настроение"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest tests */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Последние результаты тестов</CardTitle>
            <CardDescription>5 недавних прохождений</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setView("tests")}>
            Все тесты
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.latestTests.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <ClipboardCheck className="h-6 w-6 opacity-40" />
              Вы ещё не проходили тесты.
            </div>
          ) : (
            data.latestTests.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.test.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(t.completedAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    style={{
                      backgroundColor: `color-mix(in srgb, ${severityColor(t.severity)} 18%, transparent)`,
                      color: severityColor(t.severity),
                    }}
                  >
                    {t.totalScore} · {t.label}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={color}>{icon}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold">{value}</span>
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
